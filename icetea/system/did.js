/**
 * Digital identify
 * First version:
 * - owners: list of owner together with weight, default to deployedBy with weight of 1
 * - threshold: default to 1
 * - does not support anything else yet.
 */

const { checkMsg } = require('../helper/types')

const METADATA = {
  'register': {
    decorators: ['transaction'],
    params: [
      { name: 'address', type: 'string' },
      { name: 'props', type: 'object' }
    ],
    returnType: 'undefined'
  },
  'addOwner': {
    decorators: ['transaction'],
    params: [
      { name: 'address', type: 'string' },
      { name: 'owner', type: 'string' },
      { name: 'weight', type: ['string', 'undefined'] }
    ],
    returnType: 'undefined'
  },
  'setThreshold': {
    decorators: ['transaction'],
    params: [
      { name: 'address', type: 'string' },
      { name: 'threshold', type: ['number', 'undefined'] }
    ],
    returnType: 'undefined'
  },
  'checkPermission': {
    decorators: ['view'],
    params: [
      { name: 'address', type: 'string' },
      { name: 'signers', type: ['string', 'Array'] }
    ],
    returnType: 'undefined'
  }
}

function _check (owners, threshold) {
  if (threshold === undefined) {
    threshold = 1
  }

  let sum = 0
  if (owners && owners.length) {
    Object.keys(owners).forEach(addr => {
      const v = owners[addr]
      if (typeof v !== 'number' || v <= 0) {
        throw new Error('Invalid weight for owner ' + addr)
      }
      sum += v
    })
  } else {
    sum = 1 // there is no owner => same as myself only
  }

  if (typeof threshold !== 'number' || threshold <= 0) {
    throw new Error('Invalid threshold.')
  }

  if (sum < threshold) {
    throw new Error('Threshold is bigger than sum of all owner weight.')
  }
}

// standard contract interface
exports.run = (context, options) => {
  const { msg } = context.getEnv()
  checkMsg(msg, METADATA)

  const contract = {
    register (address, { owners, threshold, attributes }) {
      if (!owners && !threshold && !attributes) {
        throw new Error('Nothing to register.')
      }

      const alias = exports.systemContracts().Alias
      address = alias.ensureAddress(address)

      if (this.getState(address)) {
        throw new Error("This address is already registered. Call 'update' to update.")
      }

      _check(owners, threshold)

      const props = {}
      if (owners && owners.length) {
        props.owners = owners
      }
      if (typeof threshold === 'number' && threshold > 0) {
        props.threshold = threshold
      }
      if (attributes) {
        props.attributes = attributes
      }

      this.setState(address, props)
    },

    checkPermission (address, signers) {
      if (typeof signers === 'string') {
        signers = [signers]
      }
      const props = this.getState(address)
      if (!props || !props.owners || !props.owners.length) {
        return signers.include(address)
      }
      const threshold = props.threshold || 1
      const signWeight = signers.reduce((prev, addr) => {
        prev += (props.owners[addr] || 0)
        return prev
      }, 0)

      if (signWeight < threshold) {
        throw new Error('Permission denied.')
      }
    },

    addOwner (address, owner, weight = 1) {
      contract.checkPermission(address, msg.signers || msg.sender)

      const old = this.getState(address)
      if (!old) {
        contract.register(address, { owners: { [owner]: weight } })
      } else {
        old.owners[owner] = weight
        this.setState(address, old)
      }

      _check(old.owners, old.threshold)
    },

    setThreshold (address, threshold) {
      contract.checkPermission(address, msg.signers || msg.sender)

      const old = this.getState(address)
      if (!old) {
        if (threshold !== undefined && threshold !== 1) { contract.register(address, { threshold }) }
      } else {
        if (threshold === undefined || threshold === 1) {
          delete old.threshold
        } else {
          old.threshold = threshold
        }
        this.setState(address, old)
      }

      _check(old.owners, old.threshold)
    },

    setAttribute (address, name, value) {
      contract.checkPermission(address, msg.signers || msg.sender)

      const v = (typeof value === 'undefined') ? name : { [name]: value }
      if (typeof v !== 'object') {
        throw new Error('Invalid attribute value.')
      }

      const old = this.getState(address)
      if (!old) {
        contract.register(address, { attributes: v })
      } else {
        Object.assign(old.attributes, v)
        this.setState(address, old)
      }
    }
  }

  if (!contract.hasOwnProperty(msg.name)) {
    return METADATA
  } else {
    return contract[msg.name].apply(context, msg.params)
  }
}