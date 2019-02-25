const wasm_bindgen = function ({ log, importTableName, save_int, load_int, get_sender, get_address, now, get_block_hash, get_block_number, load_string, save_string }) { // eslint-disable-line
  var wasm
  const __exports = {}

  let cachedDecoder = new TextDecoder('utf-8')

  let cachegetUint8Memory = null
  function getUint8Memory () {
    if (cachegetUint8Memory === null ||
      cachegetUint8Memory.buffer !== wasm.memory.buffer) { cachegetUint8Memory = new Uint8Array(wasm.memory.buffer) }
    return cachegetUint8Memory
  }

  function getStringFromWasm (ptr, len) {
    return cachedDecoder.decode(getUint8Memory().subarray(ptr, ptr + len))
  }

  __exports.__wbg_f_log_log_n = function (arg0, arg1) {
    let varg0 = getStringFromWasm(arg0, arg1)
    log(varg0)
  }

  let cachedEncoder = new TextEncoder('utf-8')

  function passStringToWasm (arg) {
    const buf = cachedEncoder.encode(arg)
    const ptr = wasm.__wbindgen_malloc(buf.length)
    getUint8Memory().set(buf, ptr)
    return [ptr, buf.length]
  }

  let cachegetUint32Memory = null
  function getUint32Memory () {
    if (cachegetUint32Memory === null ||
      cachegetUint32Memory.buffer !== wasm.memory.buffer) { cachegetUint32Memory = new Uint32Array(wasm.memory.buffer) }
    return cachegetUint32Memory
  }

  __exports.__wbg_f_get_sender_get_sender_n = function (ret) {
    const [retptr, retlen] = passStringToWasm(get_sender())
    const mem = getUint32Memory()
    mem[ret / 4] = retptr
    mem[ret / 4 + 1] = retlen
  }

  __exports.__wbg_f_get_address_get_address_n = function (ret) {
    const [retptr, retlen] = passStringToWasm(get_address())
    const mem = getUint32Memory()
    mem[ret / 4] = retptr
    mem[ret / 4 + 1] = retlen
  }

  __exports.__wbg_f_load_int_load_int_n = function (arg0, arg1) {
    let varg0 = getStringFromWasm(arg0, arg1)
    return load_int(varg0)
  }

  __exports.__wbg_f_save_int_save_int_n = function (arg0, arg1, arg2) {
    let varg0 = getStringFromWasm(arg0, arg1)
    save_int(varg0, arg2)
  }

  __exports.__wbg_f_now_now_n = function () {
    return now()
  }

  __exports.__wbg_f_get_block_hash_get_block_hash_n = function (ret) {
    const [retptr, retlen] = passStringToWasm(get_block_hash())
    const mem = getUint32Memory()
    mem[ret / 4] = retptr
    mem[ret / 4 + 1] = retlen
  }

  __exports.__wbg_f_get_block_number_get_block_number_n = function () {
    return get_block_number()
  }

  __exports.__wbg_f_load_string_load_string_n = function (ret, arg0, arg1) {
    let varg0 = getStringFromWasm(arg0, arg1)
    const [retptr, retlen] = passStringToWasm(load_string(varg0))
    const mem = getUint32Memory()
    mem[ret / 4] = retptr
    mem[ret / 4 + 1] = retlen
  }

  __exports.__wbg_f_save_string_save_string_n = function (arg0, arg1, arg2, arg3) {
    let varg0 = getStringFromWasm(arg0, arg1)
    let varg2 = getStringFromWasm(arg2, arg3)
    varg2 = varg2.slice()
    wasm.__wbindgen_free(arg2, arg3 * 1)
    save_string(varg0, varg2)
  }

  __exports.main = function (arg0, arg1) {
    const [ptr0, len0] = passStringToWasm(arg0)
    try {
      return wasm.main(ptr0, len0, arg1)
    } finally {
      wasm.__wbindgen_free(ptr0, len0 * 1)
    }
  }

  __exports.__wbindgen_throw = function (ptr, len) {
    throw new Error(getStringFromWasm(ptr, len))
  }

  function init (buffer) {
    // console.log({ [importTableName]: __exports });
    return global.WebAssembly.instantiate(buffer, { [importTableName]: __exports })
      .then(({ instance }) => {
        wasm = init.wasm = instance.exports
      })
  };

  return Object.assign(init, __exports)
}

module.exports = (wasmBuffer) => {
  return async (ctx) => {
    var bindgen = wasm_bindgen(ctx)
    return bindgen(wasmBuffer).then(() => {
      return bindgen.main(ctx.get_msg_name(), ctx.get_msg_param())
    })
  }
}
