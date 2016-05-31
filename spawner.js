
var clc      = require('cli-color');
var spawn    = require ('child_process').spawn;
var fs       = require('fs');
var cfg      = require('./gcc.js');
var dbg      = require('./debug.js');
var prg      = require('./progress.js');
var killed   = false;
var firstErr = false;

exports.run = function (details, basename, runCount, reporter){

  var resultsFile = createResultsStream(basename);
  var cmd = details.shift();
  var args = details.shift();
//  console.log('in spawner');
//  console.log('cmd', cmd);
//  console.log('args', args);
  var child = spawn(cmd, args);
//  console.log('spawned', cmd, args);
  prg.update('spawner', runCount);
  child.stdout.pipe(resultsFile);

  resultsFile.on('finish', function() {
    if(dbg.flags.log_finish){
      console.log(clc.green(runCount, 'finish: ', basename));
    }

    if(killed){
      return;
    }
    else if(details.length > 0) {
//      console.log('> 0');
      exports.run(details, basename, ++runCount, reporter);
    }
    else{
//      console.log('== 0');
      reporter();
    }
  });

  //  child.on('error', function(data){
  //    console.log('data', data);
  //  });

  child.stderr.on('data', function(data){
    if(! firstErr){
      firstErr = true;
      console.log();
    }
    console.log(clc.red((data + '').replace('error:', '\nerror:')));
    killed = true;
    child.kill();
  });
  //  child.on('error', function(data){
  //    console.log('data', data);
  //  });

  child.on('exit', function (data) {
    if(data === 0)
    {
      if(dbg.flags.log_exit){
        console.log(clc.green(runCount, 'exit: ' + data, basename));
      }
    }
    else
    {
      if(dbg.flags.log_exit){
        console.log(clc.red(runCount, 'exit: ' + data, basename));
      }
    }
  });

  child.on('close', function (data) {
    if(dbg.flags.log_close){
      console.log(clc.green(runCount, 'close: ' + data, basename));
    }
  });
};

function createResultsStream(basename){
  return fs.createWriteStream(cfg.compiler.build_path + basename + '.txt');
}
