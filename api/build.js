var engine = require("seneca")({tag: "compile"});
var clc = require('cli-color');
var fs = require('fs');

engine.add({cmd: "compile"}, compile);

function createResultsStream(basename){
  return fs.createWriteStream("build/" + basename + '.txt');
}

function compile(msg, respond) {
  var spawn = require ("child_process").spawn;
  var cmd = "gccs";
  var args = ["src/a.c", "-obuild/a.o"];
  var stdout = createResultsStream("stdout");
  var stderr = createResultsStream("stderr");
  var child = spawn(cmd,args);
  var err = null;
  console.log('id', msg.id)
  child.stdout.pipe(stdout);
  child.stderr.pipe(stderr);
  child.on('error', function(data){
    console.log("*********************************** on error ****************************************************");
    respond(null, {error: data});
  });
  child.on('exit', function (data){
    respond(null, {status:data});
  });
}

engine.act({cmd: "compile", id: 123}, compile_cb);

function compile_cb(error, result) {
  if(error)
    return console.log(error);
  if(result.error) {
    console.log(result.error);
    console.log(clc.red('Error:' , result.error.path, 'returned', result.error.code));
  }
  else {
    var status = result.status;
    if(status > 0){
      fs.readFile("build/stderr.txt", 'utf8', function(err, data){
        console.log(clc.yellow(data));
        console.log(clc.red("Exited with status", status));
      });
    }
    else {
      console.log(clc.green("Exited with status", status));
    }
  }
}
