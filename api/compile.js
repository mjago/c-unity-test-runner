module.exports = function(options){

  this.add({cmd: 'compile'}, compile);

  function compile(msg, respond) {
    console.log("compiling", msg.filename);
    do_compile(msg, respond);
  }

  function do_compile(msg, respond){
    setTimeout(function(){
      respond(null, {success: 'PASS',
                     pass: msg.id,
                     fail: 0,
                     id: msg.id,
                     filename: msg.filename});
    },750);
  }
};
