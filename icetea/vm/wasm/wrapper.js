/** @module */
/*eslint-disable*/
const util = require('util');
const sizeof = require('object-sizeof')
const config = require('../../config')
const { minStateGas, gasPerByte, freeGasLimit, maxTxGas } = config.gas
const debug = require('debug')('icetea:wasm')

const wasm_bindgen = function ({ log, importTableName, get_sender, get_address, get_balance, now, get_block_hash, get_block_number, get_msg_value, get_msg_fee, load, save, has_state, delete_state, transfer, read_contract, write_contract, emit_event }) {
  var wasm
  const __exports = {}
  let gasLimit = maxTxGas // mocking, change this depend on bussiness (gas price)
  let gasUsed = 0
  let isTx = false
  if(get_msg_fee) {
    const userGas = freeGasLimit + Number(get_msg_fee())
    gasLimit = userGas > maxTxGas ? maxTxGas : userGas
    isTx = true
  }

  let cachedTextDecoder = new util.TextDecoder('utf-8')

  let cachegetUint8Memory = null
  function getUint8Memory() {
    if (cachegetUint8Memory === null || cachegetUint8Memory.buffer !== wasm.memory.buffer) {
      cachegetUint8Memory = new Uint8Array(wasm.memory.buffer)
    }
    return cachegetUint8Memory
  }

  function getStringFromWasm(ptr, len) {
    return cachedTextDecoder.decode(getUint8Memory().subarray(ptr, ptr + len))
  }

  __exports.__wbg_log_894f9ca062837e26 = function (arg0, arg1) {
    let varg0 = getStringFromWasm(arg0, arg1)
    try {
      log(varg0)
    } catch (e) {
      debug('wasm-bindgen: imported JS function "log" that was not marked as `catch` threw an error:', e)
      throw e
    }
  }

  let cachedTextEncoder = new util.TextEncoder('utf-8')

  let WASM_VECTOR_LEN = 0

  let passStringToWasm
  if (typeof cachedTextEncoder.encodeInto === 'function') {
    passStringToWasm = function (arg) {
      if (typeof (arg) !== 'string') throw new Error('expected a string argument')

      let size = arg.length
      let ptr = wasm.__wbindgen_malloc(size)
      let writeOffset = 0
      while (true) {
        const view = getUint8Memory().subarray(ptr + writeOffset, ptr + size)
        const { read, written } = cachedTextEncoder.encodeInto(arg, view)
        arg = arg.substring(read)
        writeOffset += written
        if (arg.length === 0) {
          break
        }
        ptr = wasm.__wbindgen_realloc(ptr, size, size * 2)
        size *= 2
      }
      WASM_VECTOR_LEN = writeOffset
      return ptr
    }
  } else {
    passStringToWasm = function (arg) {
      if (typeof (arg) !== 'string') throw new Error('expected a string argument')

      const buf = cachedTextEncoder.encode(arg)
      const ptr = wasm.__wbindgen_malloc(buf.length)
      getUint8Memory().set(buf, ptr)
      WASM_VECTOR_LEN = buf.length
      return ptr
    }
  }

  let cachegetUint32Memory = null
  function getUint32Memory() {
    if (cachegetUint32Memory === null || cachegetUint32Memory.buffer !== wasm.memory.buffer) {
      cachegetUint32Memory = new Uint32Array(wasm.memory.buffer)
    }
    return cachegetUint32Memory
  }

  let cachegetUint64Memory = null;
  function getUint64Memory() {
    if (cachegetUint64Memory === null || cachegetUint64Memory.buffer !== wasm.memory.buffer) {
      cachegetUint64Memory = new BigUint64Array(wasm.memory.buffer);
    }
    return cachegetUint64Memory;
  }

  __exports.__wbg_getbalance_901ea9d184937702 = function() {
    try {
      return addHeapObject(get_balance());
    } catch (e) {
      debug("wasm-bindgen: imported JS function 'getbalance' that was not marked as `catch` threw an error:", e);
      throw e;
    }
  };

  __exports.__wbg_getmsgvalue_e530ff9a41fe655f = function() {
    try {
      return addHeapObject(get_msg_value());
    } catch (e) {
      debug("wasm-bindgen: imported JS function 'getmsgvalue' that was not marked as `catch` threw an error:", e);
      throw e;
    }
  };

  __exports.__wbg_getmsgfee_7108ebe3cb9289de = function() {
    try {
      return addHeapObject(get_msg_fee());
    } catch (e) {
      debug("wasm-bindgen: imported JS function 'getmsgfee' that was not marked as `catch` threw an error:", e);
      throw e;
    }
  };

  __exports.__wbg_getsender_959abeb9602465cd = function (ret) {
    try {
      const retptr = passStringToWasm(get_sender())
      const retlen = WASM_VECTOR_LEN
      const mem = getUint32Memory()
      mem[ret / 4] = retptr
      mem[ret / 4 + 1] = retlen
    } catch (e) {
      debug('wasm-bindgen: imported JS function "getsender" that was not marked as `catch` threw an error:', e)
      throw e
    }
  }

  __exports.__wbg_getaddress_1098b528634273e9 = function (ret) {
    try {
      const retptr = passStringToWasm(get_address())
      const retlen = WASM_VECTOR_LEN
      const mem = getUint32Memory()
      mem[ret / 4] = retptr
      mem[ret / 4 + 1] = retlen
    } catch (e) {
      debug('wasm-bindgen: imported JS function "getaddress" that was not marked as `catch` threw an error:', e)
      throw e
    }
  }

  __exports.__wbg_now_5511d9fd5212e90b = function (ret) {
    try {
      return now()
    } catch (e) {
      debug('wasm-bindgen: imported JS function "now" that was not marked as `catch` threw an error:', e)
      throw e
    }
  }

  __exports.__wbg_getblockhash_f43fde2883fc6639 = function (ret) {
    try {
      const retptr = passStringToWasm(get_block_hash())
      const retlen = WASM_VECTOR_LEN
      const mem = getUint32Memory()
      mem[ret / 4] = retptr
      mem[ret / 4 + 1] = retlen
    } catch (e) {
      debug('wasm-bindgen: imported JS function "getblockchain" that was not marked as `catch` threw an error:', e)
      throw e
    }
  }

  __exports.__wbg_getblocknumber_38607e3000e0ef09 = function (ret) {
    try {
      return get_block_number()
    } catch (e) {
      debug('wasm-bindgen: imported JS function "getblocknumber" that was not marked as `catch` threw an error:', e)
      throw e
    }
  }

  const heap = new Array(32)

  heap.fill(undefined)

  heap.push(undefined, null, true, false)

  let heap_next = heap.length

  function addHeapObject(obj) {
    if (heap_next === heap.length) heap.push(heap.length + 1)
    const idx = heap_next
    heap_next = heap[idx]

    if (typeof (heap_next) !== 'number') throw new Error('corrupt heap')

    heap[idx] = obj
    return idx
  }

  __exports.__wbg_load_65f8f89efe47e8a7 = function (arg0, arg1) {
    let varg0 = getStringFromWasm(arg0, arg1)
    try {
      return addHeapObject(load(varg0))
    } catch (e) {
      debug('wasm-bindgen: imported JS function "load" that was not marked as `catch` threw an error:', e)
      throw e
    }
  }

  function getObject(idx) { return heap[idx] }

  __exports.__wbg_save_2747f995ce6b07cb = function (arg0, arg1, arg2) {
    let varg0 = getStringFromWasm(arg0, arg1)
    try {
      save(varg0, getObject(arg2))
    } catch (e) {
      debug('wasm-bindgen: imported JS function "save" that was not marked as `catch` threw an error:', e)
      throw e
    }
  }

  __exports.__wbg_hasstate_95a6b987624fdf32 = function (arg0, arg1) {
    let varg0 = getStringFromWasm(arg0, arg1)
    try {
      return has_state(varg0) ? 1 : 0;
    } catch (e) {
      debug('wasm-bindgen: imported JS function "hasstate" that was not marked as `catch` threw an error:', e)
      throw e
    }
  }

  __exports.__wbg_deletestate_e24c09c11dcf18b8 = function (arg0, arg1) {
    let varg0 = getStringFromWasm(arg0, arg1)
    try {
      delete_state(varg0)
    } catch (e) {
      debug('wasm-bindgen: imported JS function "deletestate" that was not marked as `catch` threw an error:', e)
      throw e
    }
  }

  // TBD: use read_contract and write_contract instead. Consider this later
  // __exports.__wbg_loadcontract_89a5ded7e7be8839 = function (arg0, arg1) {
  //   let varg0 = getStringFromWasm(arg0, arg1)
  //   try {
  //     return addHeapObject(load_contract(varg0))
  //   } catch (e) {
  //     debug('wasm-bindgen: imported JS function "loadcontract" that was not marked as `catch` threw an error:', e)
  //     throw e
  //   }
  // }

  __exports.__wbg_jsonstringify_8bf98dfd8c0f9963 = function (ret, arg0) {
    try {
      const retptr = passStringToWasm(JSON.stringify(getObject(arg0)))
      const retlen = WASM_VECTOR_LEN
      const mem = getUint32Memory()
      mem[ret / 4] = retptr
      mem[ret / 4 + 1] = retlen
    } catch (e) {
      debug('wasm-bindgen: imported JS function "jsonstringify" that was not marked as `catch` threw an error:', e)
      throw e
    }
  }

  __exports.__wbg_emitevent_60d77e17c3e05343 = function (arg0, arg1, arg2, arg3) {
    let varg0 = getStringFromWasm(arg0, arg1)
    try {
      emit_event(varg0, getObject(arg2), getObject(arg3))
    } catch (e) {
      debug(
        'wasm-bindgen: imported JS function "emitevent" that was not marked as `catch` threw an error:',
        e
      )
      throw e
    }
  }

  let stack_pointer = 32

  function addBorrowedObject(obj) {
    if (stack_pointer == 1) throw new Error('out of js stack')
    heap[--stack_pointer] = obj
    return stack_pointer
  }

  function dropObject(idx) {
    if (idx < 36) return
    heap[idx] = heap_next
    heap_next = idx
  }

  function takeObject(idx) {
    const ret = getObject(idx)
    dropObject(idx)
    return ret
  }

  __exports.main = function (arg0, arg1) {
    const ptr0 = passStringToWasm(arg0)
    const len0 = WASM_VECTOR_LEN
    try {
      return takeObject(wasm.main(ptr0, len0, addBorrowedObject(arg1)))
    } finally {
      wasm.__wbindgen_free(ptr0, len0 * 1)
      heap[stack_pointer++] = undefined
    }
  }

  __exports.__wbg_readcontract_6393c1bec8f423f6 = function (arg0, arg1, arg2, arg3, arg4) {
    let varg0 = getStringFromWasm(arg0, arg1)
    let varg2 = getStringFromWasm(arg2, arg3)
    try {
      return addHeapObject(read_contract(varg0, varg2, takeObject(arg4)))
    } catch (e) {
      debug('wasm-bindgen: imported JS function "readcontract" that was not marked as `catch` threw an error:', e)
      throw e
    }
  }

  __exports.__wbg_writecontract_8e1552172eb8d491 = function (arg0, arg1, arg2, arg3, arg4) {
    let varg0 = getStringFromWasm(arg0, arg1)
    let varg2 = getStringFromWasm(arg2, arg3)
    try {
      return addHeapObject(write_contract(varg0, varg2, takeObject(arg4)))
    } catch (e) {
      debug('wasm-bindgen: imported JS function "writecontract" that was not marked as `catch` threw an error:', e)
      throw e
    }
  }

  __exports.__wbg_from_4314bb5c298e92a4 = function (arg0) {
    try {
      return addHeapObject(Array.from(getObject(arg0)))
    } catch (e) {
      debug('wasm-bindgen: imported JS function "from" that was not marked as `catch` threw an error:', e)
      throw e
    }
  }

  __exports.__wbg_length_434e555f76c0b257 = function (arg0) {
    try {
      return getObject(arg0).length
    } catch (e) {
      debug('wasm-bindgen: imported JS function "length" that was not marked as `catch` threw an error:', e)
      throw e
    }
  }

  function handleError(exnptr, e) {
    const view = getUint32Memory()
    view[exnptr / 4] = 1
    view[exnptr / 4 + 1] = addHeapObject(e)
  }

  // __exports.__wbg_apply_b7cb7040572f956e = function (arg0, arg1, arg2, exnptr) {
  //   try {
  //     return addHeapObject(getObject(arg0).apply(getObject(arg1), getObject(arg2)))
  //   } catch (e) {
  //     handleError(exnptr, e)
  //   }
  // }

  // __exports.__wbg_call_b1011dd6b074a84c = function (arg0, arg1, exnptr) {
  //   try {
  //     return addHeapObject(getObject(arg0).call(getObject(arg1)))
  //   } catch (e) {
  //     handleError(exnptr, e)
  //   }
  // }

  // __exports.__wbg_call_88d2a6153573084e = function (arg0, arg1, arg2, exnptr) {
  //   try {
  //     return addHeapObject(getObject(arg0).call(getObject(arg1), getObject(arg2)))
  //   } catch (e) {
  //     handleError(exnptr, e)
  //   }
  // }

  // __exports.__wbg_call_7d492f332f3e8798 = function (arg0, arg1, arg2, arg3, exnptr) {
  //   try {
  //     return addHeapObject(getObject(arg0).call(getObject(arg1), getObject(arg2), getObject(arg3)))
  //   } catch (e) {
  //     handleError(exnptr, e)
  //   }
  // }

  // __exports.__wbg_call_f7834149513195b8 = function (arg0, arg1, arg2, arg3, arg4, exnptr) {
  //   try {
  //     return addHeapObject(getObject(arg0).call(getObject(arg1), getObject(arg2), getObject(arg3), getObject(arg4)))
  //   } catch (e) {
  //     handleError(exnptr, e)
  //   }
  // }

  __exports.__wbindgen_object_clone_ref = function (idx) {
    return addHeapObject(getObject(idx))
  }

  __exports.__wbg_get_e323dac36fd230a3 = function (arg0, arg1, exnptr) {
    try {
      return addHeapObject(Reflect.get(getObject(arg0), getObject(arg1)))
    } catch (e) {
      handleError(exnptr, e)
    }
  }

  __exports.__wbg_parse_1c7a7cd2dd24c5cb = function (arg0, arg1, exnptr) {
    let varg0 = getStringFromWasm(arg0, arg1)
    try {
      return addHeapObject(JSON.parse(varg0))
    } catch (e) {
      handleError(exnptr, e)
    }
  }

  function _assertNum(n) {
    if (typeof (n) !== 'number') throw new Error('expected a number argument')
  }

  __exports.__wbg_error_f7214ae7db04600c = function (arg0, arg1) {
    let varg0 = getStringFromWasm(arg0, arg1)

    varg0 = varg0.slice()
    wasm.__wbindgen_free(arg0, arg1 * 1)

    try {
      debug(varg0)
    } catch (e) {
      debug('wasm-bindgen: imported JS function "error" that was not marked as `catch` threw an error:', e)
      throw e
    }
  }

  __exports.__wbg_new_366f5eda217e0401 = function () {
    try {
      return addHeapObject(new Array())
    } catch (e) {
      debug('wasm-bindgen: imported JS function "new" that was not marked as `catch` threw an error:', e)
      throw e
    }
  }

  // This function is required for token.rs of Icetea Studio
  __exports.__wbg_new_a99726b0abef495b = function () {
    try {
      return addHeapObject(new Error())
    } catch (e) {
      debug('wasm-bindgen: imported JS function "new" that was not marked as `catch` threw an error:', e)
      throw e
    }
  }

  // TBD: async preparation, all function is sync now
  // new js_sys::Promise
  // __exports.__wbg_new_86c0ea6acca9eed8 = function (arg0, arg1) {
  //   let cbarg0 = function (arg0, arg1) {
  //     let a = this.a
  //     this.a = 0
  //     try {
  //       return this.f(a, this.b, addHeapObject(arg0), addHeapObject(arg1))
  //     } finally {
  //       this.a = a
  //     }
  //   }
  //   cbarg0.f = wasm.__wbg_function_table.get(36)
  //   cbarg0.a = arg0
  //   cbarg0.b = arg1
  //   try {
  //     try {
  //       return addHeapObject(new Promise(cbarg0.bind(cbarg0)))
  //     } catch (e) {
  //       debug('wasm-bindgen: imported JS function that was not marked as `catch` threw an error:', e)
  //       throw e
  //     }
  //   } finally {
  //     cbarg0.a = cbarg0.b = 0
  //   }
  // }

  // __exports.__wbg_resolve_5fc6132876c4b96b = function (arg0) {
  //   try {
  //     return addHeapObject(Promise.resolve(getObject(arg0)))
  //   } catch (e) {
  //     debug('wasm-bindgen: imported JS function that was not marked as `catch` threw an error:', e)
  //     throw e
  //   }
  // }

  // __exports.__wbg_then_d745932b7ab63614 = function (arg0, arg1) {
  //   try {
  //     return addHeapObject(getObject(arg0).then(getObject(arg1)))
  //   } catch (e) {
  //     debug('wasm-bindgen: imported JS function that was not marked as `catch` threw an error:', e)
  //     throw e
  //   }
  // }

  __exports.__wbg_stack_4931b18709aff089 = function (ret, arg0) {
    try {
      const retptr = passStringToWasm(getObject(arg0).stack)
      const retlen = WASM_VECTOR_LEN
      const mem = getUint32Memory()
      mem[ret / 4] = retptr
      mem[ret / 4 + 1] = retlen
    } catch (e) {
      debug('wasm-bindgen: imported JS function "stack" that was not marked as `catch` threw an error:', e)
      throw e
    }
  }

  __exports.__wbg_push_8cc1eb329bba75cb = function (arg0, arg1) {
    try {
      return getObject(arg0).push(getObject(arg1))
    } catch (e) {
      debug('wasm-bindgen: imported JS function "push" that was not marked as `catch` threw an error:', e)
      throw e
    }
  }

  __exports.__wbindgen_object_drop_ref = function (i) { dropObject(i) }

  __exports.__wbindgen_string_new = function (p, l) {
    return addHeapObject(getStringFromWasm(p, l))
  }

  __exports.__wbindgen_string_get = function (i, len_ptr) {
    let obj = getObject(i)
    if (typeof (obj) !== 'string') return 0
    const ptr = passStringToWasm(obj)
    getUint32Memory()[len_ptr / 4] = WASM_VECTOR_LEN
    return ptr
  }

  __exports.__wbindgen_boolean_new = function (v) {
    return addHeapObject(v === 1)
  }

  __exports.__wbindgen_number_new = function (i) {
    return addHeapObject(i)
  }

  __exports.__wbindgen_number_get = function (n, invalid) {
    let obj = getObject(n)
    if (typeof (obj) === 'number') { return obj }
    getUint8Memory()[invalid] = 1
    return 0
  }

  __exports.__wbindgen_is_null = function (idx) {
    return getObject(idx) === null ? 1 : 0
  }

  __exports.__wbindgen_is_undefined = function (idx) {
    return getObject(idx) === undefined ? 1 : 0
  }

  __exports.__wbindgen_is_function = function (i) {
    return typeof (getObject(i)) === 'function' ? 1 : 0
  }

  __exports.__wbindgen_json_serialize = function (idx, ptrptr) {
    const ptr = passStringToWasm(JSON.stringify(getObject(idx)))
    getUint32Memory()[ptrptr / 4] = ptr
    return WASM_VECTOR_LEN
  }

  __exports.__wbindgen_json_parse = function (ptr, len) {
    return addHeapObject(JSON.parse(getStringFromWasm(ptr, len)))
  }

  __exports.__wbindgen_debug_string = function (i, len_ptr) {
    const toString = Object.prototype.toString
    const debug_str = val => {
      // primitive types
      const type = typeof val
      if (type == 'number' || type == 'boolean' || val == null) {
        return `${val}`
      }
      if (type == 'string') {
        return `"${val}"`
      }
      if (type == 'symbol') {
        const description = val.description
        if (description == null) {
          return 'Symbol'
        } else {
          return `Symbol(${description})`
        }
      }
      if (type == 'function') {
        const name = val.name
        if (typeof name === 'string' && name.length > 0) {
          return `Function(${name})`
        } else {
          return 'Function'
        }
      }
      // objects
      if (Array.isArray(val)) {
        const length = val.length
        let debug = '['
        if (length > 0) {
          debug += debug_str(val[0])
        }
        for (let i = 1; i < length; i++) {
          debug += ', ' + debug_str(val[i])
        }
        debug += ']'
        return debug
      }
      // Test for built-in
      const builtInMatches = /\[object ([^\]]+)\]/.exec(toString.call(val))
      let className
      if (builtInMatches.length > 1) {
        className = builtInMatches[1]
      } else {
        // Failed to match the standard '[object ClassName]'
        return toString.call(val)
      }
      if (className == 'Object') {
        // we're a user defined class or Object
        // JSON.stringify avoids problems with cycles, and is generally much
        // easier than looping through ownProperties of `val`.
        try {
          return 'Object(' + JSON.stringify(val) + ')'
        } catch (_) {
          return 'Object'
        }
      }
      // errors
      if (val instanceof Error) {
        return `${val.name}: ${val.message}
        ${val.stack}`
      }
      // TODO we could test for more things here, like `Set`s and `Map`s.
      return className
    }
    const val = getObject(i)
    const debug = debug_str(val)
    const ptr = passStringToWasm(debug)
    getUint32Memory()[len_ptr / 4] = WASM_VECTOR_LEN
    return ptr
  }

  // __exports.__wbindgen_cb_drop = function (i) {
  //   const obj = getObject(i).original
  //   dropObject(i)
  //   if (obj.cnt-- == 1) {
  //     obj.a = 0
  //     return 1
  //   }
  //   return 0
  // }

  __exports.__wbindgen_closure_wrapper288 = function (a, b, _ignored) {
    const f = wasm.__wbg_function_table.get(28)
    const d = wasm.__wbg_function_table.get(29)
    const cb = function (arg0) {
      this.cnt++
      let a = this.a
      this.a = 0
      try {
        return f(a, b, addHeapObject(arg0))
      } finally {
        this.a = a
        if (this.cnt-- == 1) d(this.a, b)
      }
    }
    cb.a = a
    cb.cnt = 1
    let real = cb.bind(cb)
    real.original = cb
    return addHeapObject(real)
  }

  __exports.__wbindgen_throw = function (ptr, len) {
    throw new Error(getStringFromWasm(ptr, len))
  }

  __exports.__gas_used = function () {
    return gasUsed
  }

  const u32CvtShim = new Uint32Array(2);
  const int64CvtShim = new BigInt64Array(u32CvtShim.buffer);
  const uint64CvtShim = new BigUint64Array(u32CvtShim.buffer);

  __exports.__wbg_transfer_c22cbf75dc972462 = function (arg0, arg1, arg2, arg3) {
    let varg0 = getStringFromWasm(arg0, arg1);
    u32CvtShim[0] = arg2;
    u32CvtShim[1] = arg3;
    const narg2 = uint64CvtShim[0];

    try {
      transfer(varg0, narg2);
    } catch (e) {
      debug("wasm-bindgen: imported JS function 'transfer' that was not marked as `catch` threw an error:", e);
      throw e;
    }
  }

  function init(buffer) {
    // return global.WebAssembly.instantiate(buffer, { [importTableName]: __exports })
    //   .then(({ instance }) => {
    //     wasm = init.wasm = instance.exports
    //   })

    // Instantiate the Wasm module SYNC
    // Consider: cache the module or the instance for reuse later
    const instance = new WebAssembly.Instance(new WebAssembly.Module(buffer), {
      [importTableName]: __exports,
      'metering': {
        'usegas': (arg0, arg1) => {
          u32CvtShim[0] = arg0;
          u32CvtShim[1] = arg1;
          const gas = parseInt(int64CvtShim[0].toString(), 10); // BigInt cannot mixed with Number
          gasUsed += gas

          if (gasUsed > gasLimit) {
            if(isTx) {
              throw new Error("out of gas")
            }
            throw new Error("out of resources")
          }
        }
      }
    })
    wasm = init.wasm = instance.exports
  };

  return Object.assign(init, __exports)
}

/**
 * Wasm contract endpoint
 * @function
 * @param {string} wasmBuffer - wasm buffer.
 * @returns {object} wasm object
 */
module.exports = (wasmBuffer) => {
  return (ctx, info) => {
    let gasLimit = maxTxGas
    let isTx = false
    if(ctx.get_msg_fee) {
      gasLimit = freeGasLimit + Number(ctx.get_msg_fee())
      isTx = true
    }
    let gasUsed = 0
    let runCtx = { ...ctx }
    runCtx.save = (key, value) => {
      gasUsed += minStateGas
      const oldValue = ctx.load(key)
      if (oldValue === null || oldValue === undefined) {
        gasUsed += sizeof({ key: value }) * gasPerByte
      } else {
        const oldSize = sizeof({ key: oldValue })
        const newSize = sizeof({ key: value })
        gasUsed += Math.abs(newSize - oldSize) * gasPerByte
      }

      if(gasUsed > gasLimit) {
        throw new Error(`wasm save ${key} failed: out of gas`)
      }

      ctx.save(key, value)
    }
    runCtx.delete_state = key => {
      gasUsed += minStateGas

      if(gasUsed > gasLimit) {
        throw new Error(`wasm delete_state ${key} failed: out of gas`)
      }

      ctx.delete_state(key)
    }
    runCtx = Object.freeze(runCtx)

    var bindgen = wasm_bindgen(runCtx)
    bindgen(wasmBuffer)
    const result = bindgen.main(ctx.get_msg_name(), ctx.get_msg_param())
    if (info) {
      const logicGasUsed = Number(bindgen.__gas_used())
      if(info.__gas_used) {
        info.__gas_used += logicGasUsed + gasUsed
      } else {
        info.__gas_used = logicGasUsed + gasUsed
      }

      // final check for contract call contract
      if(info.__gas_used > gasLimit) {
        if(isTx) {
          throw new Error('out of gas')
        }
        throw new ErrorEvent('out of resouces')
      }
    }
    return result
  }
}
