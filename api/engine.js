var engine = require("seneca")();
var cfg = require("./gcc.js")
engine.use( "./prepare.js")
  .use( "./lint.js")
  .use( "./misra.js")
  .use( "./compile.js")
  .use( "./collect.js")
  .use( "./compile_gcc.js")
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
console.log('here');
}

engine.act({cmd: 'collect'}, collect_result);
