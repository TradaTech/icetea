const { randomAccountWithBalance, sleep } = require('../helper')
const startup = require('../../icetea/abcihandler')
const { ContractMode } = require('icetea-common')
const { IceTeaWeb3 } = require('icetea-web3')
const server = require('abci')
const createTempDir = require('tempy').directory

jest.setTimeout(30000)

let tweb3
let account10k // this key should have 10k of coins before running test suite
let instance
beforeAll(async () => {
  const handler = await startup({ path: createTempDir() })
  instance = server(handler)
  instance.listen(global.ports.abci)
  await sleep(4000)

  tweb3 = new IceTeaWeb3(`http://127.0.0.1:${global.ports.rpc}`)
  account10k = await randomAccountWithBalance(tweb3, 10000)
})

afterAll(() => {
  tweb3.close()
  instance.close()
})

const hackerSrc = `
  const _ = require('lodash')

  @contract class Hacker {
    @pure changeRequire() {
      require = undefined
    }

    @pure changeFunc() {
      let isNil = _.isNil
      isNil = undefined
      _.isNil = undefined
    }

    @pure useFunc() {
      return _.isNil(undefined)
    }

    @pure usegasPure() {
      this.usegas = undefined
    }

    @view usegasView() {
      let usegas = this.usegas
      usegas = undefined
      return this.usegas === undefined
    }
  }
`

describe('restart app', () => {
  test('some funny hack', async () => {
    const { privateKey, address: from } = account10k
    tweb3.wallet.importAccount(privateKey)

    const result = await tweb3.deploy(ContractMode.JS_DECORATED, hackerSrc, [], { from })
    expect(result.address).toBeDefined()
    const hackerContract = tweb3.contract(result.address)

    await expect(hackerContract.methods.changeRequire().callPure()).rejects.toThrow(Error)

    await hackerContract.methods.changeFunc().callPure()
    await expect(hackerContract.methods.useFunc().callPure()).rejects.toThrow(Error)

    // jest does not implement require.cache so you should clear by hand
    // recommend to test on real environment
    // issue: https://github.com/facebook/jest/issues/5741
    jest.resetModules()

    const tmp = await hackerContract.methods.useFunc().callPure()
    expect(tmp).toBe(true)

    await expect(hackerContract.methods.usegasPure().callPure()).rejects.toThrow(Error)

    const r = await hackerContract.methods.usegasView().call()
    expect(r).toBe(false)
  })

  test('prevent hack on deployment', async () => {
    const { privateKey, address: from } = account10k
    tweb3.wallet.importAccount(privateKey)

    await expect(tweb3.deploy(ContractMode.JS_DECORATED, `
      @contract class Hack1 {
        constructor() {
          new Function("return process")().exit()
        }
      }
    `, [], { from })).rejects.toThrow(Error)

    await expect(tweb3.deploy(ContractMode.JS_DECORATED, `
      @contract class Hack2 {
        constructor() {
          this.constructor.constructor("return process")().exit()
        }
      }
    `, [], { from })).rejects.toThrow(Error)

    await expect(tweb3.deploy(ContractMode.JS_DECORATED, `
      @contract class Hack3 {
        constructor() {
          const require = new Function("return process.mainModule.require")();
          console.log(require);
        }
      }
    `, [], { from })).rejects.toThrow(Error)

    await expect(tweb3.deploy(ContractMode.JS_DECORATED, `
      @contract class Hack4 {
        constructor() {
          const global = new Function("return global")();
          console.log(global);
        }
      }
    `, [], { from })).rejects.toThrow(Error)
  })
})