module.exports = function(options){

  this.add({cmd: 'link'},    link);

  function link(msg, respond) {
    console.log("linking", msg.filename);
    do_link(msg, respond);
  }

  function do_link(msg, respond){
    setTimeout(function(){
      respond(null, {success: 'PASS',
                     pass: msg.id,
                     fail: 0,
                     id: msg.id,
                     filename: msg.filename});
    }, 750);
  }
};
