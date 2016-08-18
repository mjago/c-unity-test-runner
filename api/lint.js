module.exports = function(options){

  this.add({cmd: 'lint'},   lint);

  function lint(msg, respond) {
    console.log("LINTing", msg.filename);
    do_lint(msg, respond);
  }

  function do_lint(msg, respond){
    setTimeout(function(){
      respond(null, {success: 'PASS',
                     pass: msg.id,
                     fail: 0,
                     id: msg.id,
                     filename: msg.filename});
    }, 500);
  }
};
