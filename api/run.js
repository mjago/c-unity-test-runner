module.exports = function(options){

  this.add({cmd: 'run'},    run);

  function run(msg, respond) {
    console.log('running', msg.filename);
    do_run(msg, respond);
  }
  function do_run(msg, respond){
    setTimeout(function(){
      respond(null, {success: 'PASS',
                     pass: msg.id,
                     fail: 0,
                     id: msg.id,
                     filename: msg.filename});
    },500);
  }
};
