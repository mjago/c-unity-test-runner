engine = require('seneca')();
engine.passes = 0;
engine.fails  = 0;
engine.test_count = 5000;
engine.prepare_count = 0;
engine.lint_count = 0;
engine.misra_count = 0;
engine.compile_count = 0;
engine.link_count = 0;
engine.run_count = 0;
engine.store_count = 0;
engine.result_count = 0;
engine.add({cmd: 'prepare'}, prepare);
engine.add({cmd: 'lint'},   lint);
engine.add({cmd: 'misra'},   misra);
engine.add({cmd: 'compile'}, compile);
engine.add({cmd: 'link'},    link);
engine.add({cmd: 'run'},    run);
engine.add({cmd: 'store'},   store);

function prepare(msg, respond) {
  engine.prepare_count += 1;
  if(engine.prepare_count === 1){
    console.log('preparing...');
  }
  if(engine.prepare_count === engine.test_count){
    console.log('prepared');
  }
  respond(null, {success: 'PASS', pass: msg.id, fail: 0, id: msg.id});
}

function lint(msg, respond) {
  engine.lint_count += 1;
  if(engine.lint_count === 1){
    console.log('running LINT checks...');
  }
  if(engine.lint_count === engine.test_count){
    console.log('LINT checks finished');
  }
  respond(null, {success: 'PASS', pass: msg.id, fail: 0, id: msg.id});
}

function misra(msg, respond) {
  engine.misra_count += 1;
  if(engine.misra_count === 1){
    console.log('validating against MISRA...');
  }
  if(engine.misra_count === engine.test_count){
    console.log('MISRA checks finished');
  }
  respond(null, {success: 'PASS', pass: msg.id, fail: 0, id: msg.id});
}

function compile(msg, respond) {
  engine.compile_count += 1;
  if(engine.compile_count === 1){
    console.log('compiling...');
  }
  if(engine.compile_count === engine.test_count){
    console.log('compiled');
  }
  respond(null, {success: 'PASS', pass: msg.id, fail: 0, id: msg.id});
}

function link(msg, respond) {
  engine.link_count += 1;
  if(engine.link_count === 1){
    console.log('linking...');
  }
  if(engine.link_count === engine.test_count){
    console.log('linked');
  }
  respond(null, {success: 'PASS', pass: msg.id, fail: 0, id: msg.id});
}

function run(msg, respond) {
  engine.run_count += 1;
  if(engine.run_count === 1){
    console.log('running...');
  }
  if(engine.run_count === engine.test_count){
    console.log('runs complete');
  }
  respond(null, {success: 'PASS', pass: msg.id, fail: 0, id: msg.id});
}

function store(msg, respond) {
  engine.store_count += 1;
  if(engine.store_count === 1){
    console.log('storing...');
  }
  if(engine.store_count === engine.test_count){
    console.log('stored');
  }
  respond(null, {success: 'PASS', pass: msg.id, fail: 0, id: msg.id});
}

function prepare_result(error, result) {
  if(error){
    return error;
  }
  else{
    engine.act({cmd: 'lint', id: result.id}, lint_result);
  }
}

function lint_result(error, result) {
  if(error){
    return error;
  }
  else{
    engine.act({cmd: 'misra', id: result.id}, misra_result);
  }
}

function misra_result(error, result) {
  if(error){
    return error;
  }
  else{
    engine.act({cmd: 'compile', id: result.id}, compile_result);
  }
}

function compile_result(error, result) {
  if(error){
    return error;
  }
  else{
    engine.act({cmd: 'link', id: result.id}, link_result);
  }
}

function link_result(error, result) {
  if(error){
    return error;
  }
  else{
    engine.act({cmd: 'run', id: result.id}, run_result);
  }
}

function run_result(error, result) {
  if(error){
    return error;
  }
  else{
    engine.act({cmd: 'store', id: result.id}, store_result);
  }
}

function store_result(error, result){
  if(error){
    return error;
  }
  else{
    engine.passes += result.pass;
    engine.fails  += result.fail;
    engine.result_count += 1;
//    console.log('engine.result_count:', engine.result_count);
    if(engine.result_count === engine.test_count)
      print_results();
  }
}

function print_results(){
  console.log('printing:');
  console.log('  Pass:', engine.passes);
  console.log('  Fail:', engine.fails);
}

function run_tests(count){
  engine.test_count = count;
  for(var count = 1; count <= engine.test_count; count++) {
    engine.act({cmd: 'prepare', id: count}, prepare_result);
  }
}

run_tests(1000);
