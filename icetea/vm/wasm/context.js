/** @module */
const { emitEvent } = require('../../helper/utils')
const invoker = require('../../invoker/contractinvoker')

/**
 * context for (with invoke type)
 * @function
 * @param {string} invokeType - invoke type
 * @param {string} contractAddress - contract address.
 * @param {string} methodName - method name.
 * @param {Array.<string|number>} methodParams - parameters.
 * @param {object} options - method option.
 * @returns {object} context
 */
exports.for = (invokeType, contractAddress, methodName, methodParams, options) => {
  const map = {
    transaction: exports.forTransaction,
    view: exports.forView,
    pure: exports.forPure
  }

  const fn = map[invokeType] ? map[invokeType] : exports.forMetadata
  return typeof fn === 'function' ? fn(contractAddress, methodName, methodParams, options) : fn
}

/**
 * context for transaction
 * @function
 * @param {string} address - contract address.
 * @param {string} fname - method name.
 * @param {Array.<string|number>} fparams - parameters.
 * @param {object} options - method option.
 * @returns {object} context
 */
exports.forTransaction = (address, fname, fparams = [], options) => {
  const { tx, block, stateAccess, tools, events } = options
  const { balanceOf, getCode } = tools
  const {
    hasState,
    getState,
    setState,
    deleteState,
    transfer
  } = stateAccess.forUpdate(address)

  const importTableName = getCode(address).meta.importTableName

  const ctx = {
    get_address: () => address,
    get_balance: () => balanceOf(address),
    runtime: { },
    importTableName,
    log: console.log,
    get_msg_name: () => fname,
    get_msg_param: () => fparams.map(x => typeof x === 'number' ? x.toString() : x),
    get_msg_value: () => tx.value,
    get_msg_fee: () => tx.fee,
    get_sender: () => tx.from || '',
    now: () => block.timestamp,
    get_block_hash: () => block.hash,
    get_block_number: () => block.number,
    read_contract: (to, method, params) => {
      return invoker.invokeView(to, method, params, { ...options, from: address })
    },
    write_contract: (to, method, params) => {
      return invoker.invokeUpdate(to, method, params, options)
    },
    has_state: hasState,
    load: key => getState(key, ''),
    save: setState,
    delete_state: deleteState,
    transfer,
    emit_event: (eventName, eventData, indexes = []) => {
      emitEvent(address, events, eventName, eventData, indexes)
    }
  }

  return ctx
}

/**
 * context for view
 * @function
 * @param {string} address - contract address.
 * @param {string} name - method name.
 * @param {Array.<string|number>} params - parameters.
 * @param {object} option - method option.
 * @returns {object} context
 */
exports.forView = (address, name, params = [], options) => {
  const { from = '', block, stateAccess, tools } = options
  const { balanceOf, getCode } = tools
  const {
    hasState,
    getState,
    setState,
    deleteState,
    transfer
  } = stateAccess.forView(address)

  const importTableName = getCode(address).meta.importTableName

  const ctx = {
    get_address: () => address,
    get_balance: () => balanceOf(address),
    log: console.log,
    importTableName,
    get_msg_name: () => name,
    get_msg_param: () => params.map(x => typeof x === 'number' ? x.toString() : x),
    get_msg_value: () => { throw new Error('Cannot get message value inside a view function') },
    get_sender: () => from,
    now: () => block.timestamp,
    get_block_hash: () => block.hash,
    get_block_number: () => block.number,
    read_contract: (to, method, params) => {
      return invoker.invokeView(to, method, params, { ...options, from: address })
    },
    write_contract: (to, method, params) => {
      throw new Error('Cannot write_contract inside a view function')
    },
    has_state: hasState,
    load: key => getState(key, ''),
    save: setState,
    delete_state: deleteState,
    transfer
  }

  return ctx
}

/**
 * context for pure
 * @function
 * @param {string} address - contract address.
 * @param {string} name - method name.
 * @param {Array.<string|number>} params - parameters.
 * @param {object} option - method option.
 * @returns {object} context
 */
exports.forPure = (address, name, params = [], options) => {
  const { from = '', tools } = options
  const { getCode } = tools
  const importTableName = getCode(address).meta.importTableName

  const ctx = {
    address,
    importTableName,
    get_address: () => address,
    log: console.log,
    get_msg_name: () => name,
    get_msg_param: () => params.map(x => typeof x === 'number' ? x.toString() : x),
    get_sender: () => from
  }

  return ctx
}

/**
 * metadata for unlisted invoke type
 */
exports.forMetadata = {
  log: console.log,
  get_msg_name: () => '__metadata',
  get_msg_param: () => 0,
  get_sender: () => ''
}
