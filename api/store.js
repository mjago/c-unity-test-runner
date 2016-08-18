module.exports = function(options){

  this.add({cmd: 'store'},   store);

  function store(msg, respond) {
    console.log('storing', msg.filename);
    do_store(msg, respond);
  }

  function do_store(msg, respond){
    setTimeout(function(){
      respond(null, {success: 'PASS',
                     pass: msg.id,
                     fail: 0,
                     id: msg.id,
                     filename: msg.filename});
    }, 100);
  }
};

