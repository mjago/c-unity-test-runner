module.exports = function(options){
  var seneca = this;
  seneca.add({cmd: 'prepare'}, prepare);

  function prepare(msg, respond) {
    seneca.prepare_count += 1;
    if(seneca.prepare_count === 1){
      console.log('preparing...');
    }
    if(seneca.prepare_count === seneca.test_count){
      console.log('prepared');
    }
    respond(null, {success: 'PASS', pass: msg.id, fail: 0, id: msg.id});
  }
};
