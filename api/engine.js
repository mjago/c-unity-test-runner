var engine = require("seneca")();
var cfg = require("./gcc.js")
engine.use( "./prepare.js")
  .use( "./lint.js")
  .use( "./misra.js")
  .use( "./compile.js")
  .use( "./collect.js")
  .use( "./compile_gcc.js")
  .use( "./find_tests.js")
  .use( "./build_tests.js")
  .use( "./find_requisite_c_files.js")
  .use( "./build_requisite_c_files.js")
  .use( "./link.js")
  .use( "./run.js")
  .use( "./store.js");

engine.passes = 0;
engine.fails  = 0;

function prepare_result(error, result) {
  if(error){
    return error;
  }
  console.log("to test:", result.filename);
  engine.act({cmd: 'lint',
              id: result.id,
              filename: result.filename},
             lint_result);
}

function lint_result(error, result) {
  if(error){
    return error;
  }
  console.log("LINTed:", result.filename);
  engine.act({cmd: 'misra',
              id: result.id,
              filename: result.filename},
             misra_result);
}

function misra_result(error, result) {
  if(error){
    return error;
  }
  console.log("MISRA check complete for", result.filename);
  engine.act({cmd: 'compile',
              id: result.id,
              filename: result.filename},
             compile_result);
}

function compile_result(error, result) {
  if(error){
    return error;
  }
  console.log("compiled", result.filename);
  engine.act({cmd: 'link',
              id: result.id,
              filename: result.filename},
             link_result);
}

function link_result(error, result) {
  if(error){
    return error;
  }
  console.log('linked', result.filename);
  engine.act({cmd: 'run',
              id: result.id,
              filename: result.filename},
             run_result);
}

function run_result(error, result) {
  if(error){
    return error;
  }
  console.log('ran', result.filename);
  engine.act({cmd: 'store',
              id: result.id,
              filename: result.filename},
             store_result);
}

function store_result(error, result){
  if(error){
    return error;
  }
  console.log('stored', result.filename);
  engine.passes += 1;//result.pass;
  engine.fails  += result.fail;
  engine.result_count += 1;
  print_result(result);
}

function print_result(result){
  console.log('passed:', result.filename, 'total passes:', engine.passes);
  console.log('total fails:', engine.fails);
}

function run_tests(){
  engine.act({cmd: 'prepare'}, prepare_result);
}

//run_tests();


function collect_result(error, result) {
  engine.act({cmd: 'compileGCC',
              args: result.args,
              basename: result.basename},
             compileGCC_result);
  //  console.log(result.args)
}

function compileGCC_result(error, result) {
  console.log('compiled');
  engine.act({cmd: 'findTests', cfg: cfg}, findTests_result);
}

function findTests_result(error, result) {
  //console.log('filenames',result.filenames);
  //console.log('basenames',result.basenames);
  console.log('found files');
  engine.act({cmd: 'buildTests',
              cfg: cfg,
              filenames: result.filenames,
              basenames: result.basenames },
             buildTests_result);
}

function buildTests_result(error, result) {
//  console.log(result.headers);
  console.log('buildTestsSync built!')
  engine.act({cmd: 'findRequisiteCFiles',
              cfg: cfg,
              headers: result.headers},
             findRequisiteCFiles_result);
}

function findRequisiteCFiles_result(error, result) {
//  console.log(result.includedCFiles);
  console.log('requisite C files found!');
  engine.act({cmd: 'buildRequisiteCFiles',
              cfg: cfg,
              includedCFiles: result.includedCFiles},
//              includedCFiles: ['test']},
             buildRequisiteCFiles_result);
}

function buildRequisiteCFiles_result(error, result) {
//  console.log('args', result.args)
//  console.log('basename', result.basename)
//  console.log('requisite C files built!');
  engine.act({cmd: 'compileGCC',
              args: result.args,
              basename: result.basename},
             builtRequisiteCFiles_result);
}

function builtRequisiteCFiles_result(error, result) {
  console.log('built!');
}

function runTests() {
  engine.act({cmd: 'collect'}, collect_result);
}

runTests();

