/** @module */
const { decode } = require('@webassemblyjs/wasm-parser')
const { traverse } = require('@webassemblyjs/ast')

/**
 * parse metadate for a wasm file
 * @function
 * @param {string} buffer wasm buffer
 * @returns {object} import table name and operations
 */
exports.parseMetadata = (buffer) => {
  let importTableName
  let mainFnFound
  const operations = []
  const ast = decode(buffer, { dump: false, ignoreCodeSection: true })
  traverse(ast, {
    ModuleExport (path) {
      const fn = path.node.name
      if (fn === 'main') {
        mainFnFound = true
      } else if (!['memory', '__wbindgen_malloc', '__wbindgen_realloc', '__wbindgen_free', '__rustc_debug_gdb_scripts_section__', '__wbg_function_table'].includes(fn)) {
        operations.push(fn)
      }
    },
    ModuleImport (path) {
      if (!importTableName) {
        importTableName = path.node.module
      } else if (importTableName !== path.node.module) {
        if (path.node.module !== 'metering') {
          throw new Error('Invalid Rust wasm_bindgen WASM module: inconsistent import module name.')
        }
      }
    }
  })

  if (!mainFnFound) {
    throw new Error('Invalid Rust wasm_bindgen WASM module: main function not exported')
  }

  // TBD: if wasm file empty, importTableName = meter => remove this condition
  if (!importTableName) {
    throw new Error('Invalid Rust wasm_bindgen WASM module: import table not found.')
  }

  return { importTableName, operations }
}
