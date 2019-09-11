const { verifyTxSignature } = require('@iceteachain/common/src/utils')
const _ = require('lodash')
const utils = require('./helper/utils')
const sysContracts = require('./system')
const invoker = require('./contractinvoker')
const did = require('./system/did')
const election = require('./system/election')
const { ecc, codec, AccountType } = require('@iceteachain/common')
const config = require('./config')
const sizeof = require('object-sizeof')
const debug = require('debug')('icetea:app')

const { minStateGas, gasPerByte, minTxGas, maxTxGas } = config.contract
const { setFreeGasLimit } = config

const stateManager = require('./statemanager')

function _ensureAddress (addr) {
  // resolve alias
  if (addr && addr.includes('.')) {
    return sysContracts.Alias.ensureAddress(addr)
  }

  return addr
}

class App {
  constructor () {
    // Copy some methods
    Object.assign(this, {
      setBlock: stateManager.setBlock.bind(stateManager),
      persistState: stateManager.persist.bind(stateManager),
      balanceOf: stateManager.balanceOf.bind(stateManager),
      debugState: stateManager.debugState.bind(stateManager)
    })
  }

  loadState ({ freeGasLimit: _freeGasLimit, path }) {
    // TBD: now use global config for convenience
    // prefer to save it in app and pass to other component
    if (!_.isNil(_freeGasLimit)) {
      setFreeGasLimit(_freeGasLimit)
    }
    return stateManager.load(path)
  }

  async activate () {
    this.initSystemContracts()
    await stateManager.load()
    const lastState = await stateManager.getLastState()
    debug('Last state loaded', { height: lastState.lastBlockHeight, appHash: lastState.lastBlockAppHash.toString('hex').toUpperCase() })
    return lastState
  }

  installSystemContracts (args) {
    sysContracts.all().forEach(key => {
      const state = stateManager.installSystemContract(key)
      const contract = sysContracts.get(key)
      if (typeof contract.ondeploy === 'function') {
        contract.ondeploy(state, args)
      }
    })
  }

  initSystemContracts () {
    sysContracts.all().forEach(key => {
      const contract = sysContracts.get(key)
      contract.systemContracts = () => sysContracts
      contract.unsafeStateManager = () => stateManager
    })
  }

  getContractAddresses (preferAlias) {
    const addreses = stateManager.getContractAddresses()
    if (!preferAlias || !addreses.length) return addreses

    const aliases = sysContracts.Alias.getAliases()
    const aliasKeys = Object.keys(aliases)
    if (!aliasKeys.length) return addreses

    const address2Alias = aliasKeys.reduce((prev, alias) => {
      const address = aliases[alias].address
      prev[address] = alias
      return prev
    }, {})

    return addreses.map(addr => (Object.prototype.hasOwnProperty.call(address2Alias, addr) ? address2Alias[addr] : addr))
  }

  addStateObserver ({ beforeTx, afterTx }) {
    stateManager.on('beginCheckpoint', beforeTx)
    stateManager.on('endCheckpoint', afterTx)
  }

  checkTx (tx) {
    const { freeGasLimit } = config.contract
    // NOTE:
    // CheckTX should not modify state
    // This way, we could avoid make a copy of state
    // For example: do not change balance or exec contract to see if errors
    // Such kind of error will be catch by deliver_tx eventually.

    if (tx.value < BigInt(0)) {
      throw new Error('Invalid transaction value.')
    }

    if (tx.fee < BigInt(0)) {
      throw new Error('Invalid transaction fee.')
    }

    if (Number(tx.fee) + freeGasLimit < minTxGas) {
      throw new Error(`tx fee ${tx.fee} is too low, at least ${minTxGas}`)
    }

    if (Number(tx.fee) > maxTxGas) {
      throw new Error(`tx fee ${tx.fee} is too high, at most ${maxTxGas}`)
    }

    if (!tx.isSimpleTransfer() && !tx.isContractCall() && !tx.isContractCreation()) {
      throw new Error('Unrecognized transaction type.')
    }

    if (tx.isContractCall() && tx.messageName() === '_beforePayFor') {
      throw new Error('Cannot call _beforePayFor directly.')
    }

    verifyTxSignature(tx)

    if (tx.from) {
      tx.from = _ensureAddress(tx.from)
      ecc.validateAddress(tx.from)
    }

    if (tx.payer) {
      tx.payer = _ensureAddress(tx.payer)
    }

    // verify TO to avoid lost fund
    if (tx.to) {
      if (tx.isContractCreation()) {
        throw new Error('Transaction destination address must be blank when deploying a contract.')
      }

      tx.to = _ensureAddress(tx.to)
      if (!sysContracts.has(tx.to)) {
        const toType = ecc.validateAddress(tx.to).type
        if (tx.value > BigInt(0) && toType === AccountType.REGULAR_ACCOUNT) {
          throw new Error('Could not transfer to regular account.')
        }
      }
    } else {
      if (!tx.isContractCreation()) {
        throw new Error('Transaction destination address is required.')
      }
    }

    // ensure valid signers
    if (tx.signers.length === 0) {
      throw new Error('Must have at lease one signature.')
    } else if (tx.signers.length === 1) {
      // if (tx.from === tx.signers[0]) {
      //   throw new Error("No need to set 'from' to save blockchain data size.") // so strict!
      // }
    } else if (!tx.from) {
      throw new Error("Must explicitly set 'from' when there are more than 1 signer.")
    }

    tx.from = tx.from || tx.signers[0]
    const blockTimestamp = (stateManager.getBlock() || {}).timestamp || 0
    did.checkPermission(tx.from, tx.signers, blockTimestamp)

    // check payer
    const hasPayer = !!tx.payer && (tx.payer !== tx.from)
    if (!hasPayer) {
      if (tx.value + tx.fee > BigInt(0) && codec.isRegularAddress(tx.from)) {
        // This seems redundant since regular account should always have balance of 0
        throw new Error('Cannot transfer from a regular account without specifying a payer.')
      }
    } else {
      if (!sysContracts.has(tx.payer)) {
        const { type: ptype } = ecc.validateAddress(tx.payer)
        if (ptype === AccountType.REGULAR_ACCOUNT) {
          throw new Error('Cannot specify a regular account as transaction payer.')
        }
      }

      // check if the payer is a contract or an user
      // this only reference state, not modify => should be ok
      if (stateManager.isContract(tx.payer)) {
        let agree = false
        try {
          agree = this.invokeView(tx.payer, '_agreeToPayFor', [tx])
        } catch (err) {
          throw new Error('Payer throws exception: ' + (err.stack || String(err)))
        }

        if (!agree) {
          throw new Error('Payer does not agree to pay.')
        }
      } else {
        did.checkPermission(tx.payer, tx.signers, blockTimestamp)
      }
    }

    // payer appears ok, ensure it has value for simpler later logic
    if (!tx.payer) {
      tx.payer = tx.from
    }

    // Check balance
    if (tx.value + tx.fee > stateManager.balanceOf(tx.payer)) {
      throw new Error('Not enough balance')
    }
  }

  invokeView (contractAddress, methodName, methodParams, options = {}) {
    // resolve alias
    contractAddress = _ensureAddress(contractAddress)

    const { stateAccess, tools } = stateManager.produceDraft()
    options.stateAccess = stateAccess
    options.tools = tools
    options.block = stateManager.getBlock()
    return invoker.invokeView(contractAddress, methodName, methodParams, options)
  }

  invokePure (contractAddress, methodName, methodParams, options = {}) {
    // resolve alias
    contractAddress = _ensureAddress(contractAddress)

    const { tools } = stateManager.produceDraft()
    options.tools = tools
    options.block = stateManager.getBlock()
    return invoker.invokePure(contractAddress, methodName, methodParams, options)
  }

  getMetadata (addr) {
    // resolve alias
    addr = _ensureAddress(addr)

    const { system, src, meta } = stateManager.getAccountState(addr)
    if (!src && !system) {
      throw new Error('Address is not a valid contract.')
    }

    if (meta && meta.operations) {
      return utils.unifyMetadata(meta.operations)
    }

    const info = invoker.queryMetadata(addr, stateManager.getMetaProxy(addr))
    if (!info) return utils.unifyMetadata()

    const props = info.meta ||
      (info.instance ? utils.getAllPropertyNames(info.instance) : info)

    return utils.unifyMetadata(props)
  }

  getAccountInfo (addr) {
    addr = _ensureAddress(addr)
    const { balance = 0, system, mode, src, deployedBy } = stateManager.getAccountState(addr)
    return { balance, system, mode, hasSrc: !!src, deployedBy }
  }

  getContractSource (addr) {
    addr = _ensureAddress(addr)
    const src = stateManager.getAccountState(addr).src
    if (src && Buffer.isBuffer(src)) {
      return src.toString('base64')
    }
    return src
  }

  execTx (tx, tags) {
    this.checkTx(tx)

    // No need, already done inside checkTx above
    // tx.to = _ensureAddress(tx.to)

    stateManager.beginCheckpoint()

    const needState = willCallContract(tx)
    const { stateAccess, patch, tools } = needState ? stateManager.produceDraft() : {}

    const result = doExecTx({
      tx,
      block: stateManager.getBlock(),
      stateAccess,
      tools,
      tags
    })

    // commit change made to state
    // if _doExecTx throws, this won't be called
    if (needState) {
      stateManager.applyDraft(patch)
    }

    stateManager.endCheckpoint()

    return result
  }

  initValidators () {
    let validators = []
    try {
      validators = election.getValidators()
    } catch (err) {
      throw new Error('getValidators throws exception: ' + (err.stack || String(err)))
    }
    return stateManager.setValidators(validators)
  }

  async getValidators (height) {
    return stateManager.getValidators(height)
  }

  endBlock (height) {
    if (height % config.election.epoch === 0) {
      let newValidators = []
      try {
        newValidators = election.getValidators()
      } catch (err) {
        throw new Error('getValidators throws exception: ' + (err.stack || String(err)))
      }
      const validatorUpdates = stateManager.getUpdatedValidators(newValidators)
      stateManager.setValidators(newValidators)
      return {
        validatorUpdates
      }
    }
    return {}
  }
}

/**
 * validate tx op and tx.to source
 * @private
 * @function
 * @param {object} tx - transation
 * @return {boolean} is right to execute
 */
function willCallContract (tx) {
  return tx.isContractCreation() || tx.isContractCall() ||
    (tx.value > BigInt(0) && stateManager.isContract(tx.to)) ||
    (tx.value + tx.fee > BigInt(0) && tx.payer && tx.payer !== tx.from && stateManager.isContract(tx.payer))
}

/**
 * execute tx logic
 * @private
 * @function
 * @param {object} options - options
 * @return {object} result
 */
function doExecTx (options) {
  const { tx, tools = {} } = options
  options.info = { __gas_used: 0 }
  let result

  if (tx.isContractCreation()) {
    // analyze & save contract state
    const contractState = invoker.prepareContract(tx)
    tx.to = tools.deployContract(tx.from, contractState)

    // deploy fee
    options.info.__gas_used += minStateGas + sizeof(contractState) * gasPerByte
  }

  // process value transfer
  if (tx.value + tx.fee > 0) {
    if (tx.payer !== tx.from) {
      const tmpTx = Object.assign({}, tx)
      tmpTx.from = 'system'
      invoker.invokeUpdate(tx.payer, '_beforePayFor', [tx], Object.assign({}, options, { tx: tmpTx }))
    }
    (tools.refectTxValueAndFee || stateManager.handleTransfer)(tx)
  }

  if (tx.isContractCreation()) {
    // call constructor
    invoker.invokeUpdate(
      tx.to,
      '__on_deployed',
      tx.data.params,
      options
    )

    // Skip this check because Wasm currently returns boolean
    // if (typeof result !== 'undefined') {
    //   throw new Error('Constructor or __on_deployed function could not return non-undefined value.')
    // }

    // Result of ondeploy should be address
    result = tx.to
  } else if (tx.isContractCall()) {
    if (['constructor', '__on_received', '__on_deployed', 'getState', 'setState', 'deleteState', 'runtime'].includes(tx.data.name)) {
      throw new Error('Calling this method directly is not allowed')
    }
    result = invoker.invokeTx(options)
  } else if (tx.value && stateManager.isContract(tx.to)) {
    // call __on_received for regular transfer
    result = invoker.invokeUpdate(tx.to, '__on_received', tx.data.params, options)
  }

  let actualFee = minTxGas
  if (tools.refectTxValueAndFee || stateManager.handleTransfer) {
    if (options.info && options.info.__gas_used) {
      actualFee += options.info.__gas_used
      if (actualFee > maxTxGas) {
        throw new Error(`gas used ${actualFee} is too high, at most ${maxTxGas}`)
      }
    }

    const { freeGasLimit } = config.contract
    actualFee = actualFee > freeGasLimit ? (actualFee - freeGasLimit) : 0
    if (tx.fee < BigInt(actualFee)) {
      throw new Error('Insufficient fee')
    }
    const refundTx = { payer: tx.payer, value: BigInt(0), fee: -(tx.fee - BigInt(actualFee)) }
    const refundFunc = tools.refectTxValueAndFee || stateManager.handleTransfer
    refundFunc(refundTx)
  }

  // emit Transferred event
  if (tx.value > BigInt(0)) {
    utils.emitTransferred(null, options.tags, tx.from, tx.to, tx.payer, tx.value)
  }

  // add gasused tag
  if (actualFee > 0) {
    // utils.emitGasUsed(null, options.tags, tx.to, tx.data.name, actualFee)
    options.tags['tx.gasused'] = String(actualFee)
  }

  return result
}

module.exports = utils.newAndBind(App)
