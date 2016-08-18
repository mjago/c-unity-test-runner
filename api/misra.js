module.exports = function(options){

  this.add({cmd: 'misra'},   misra);

  function misra(msg, respond) {
    console.log("MISRA checking", msg.filename);
    do_misra(msg, respond);
  }

  function do_misra(msg, respond){
    setTimeout(function(){
      respond(null, {success: 'PASS',
                     pass: msg.id,
                     fail: 0,
                     id: msg.id,
                     filename: msg.filename});
    },500);
  }
};
