var sem             = require('semaphore')(2);

exports.run = function (details, basename, runCount, reporter){

  sem.take(function() {

    run(details, basename, runCount, reporter);

    sem.leave();
  });
};

var clc      = require('cli-color');
var spawn    = require ('child_process').spawn;
var fs       = require('fs');
var cfg      = require('./gcc.js').data();
var dbg      = require('./debug.js');
var prg      = require('./progress.js');
var killed   = false;
var firstErr = false;

var run = function (details, basename, runCount, reporter){
  var cmd = details.shift();
  var args = details.shift();

//  console.log('basename', basename);
//  console.log('runCount', runCount);
//  console.log('args', args);
  if(runCount == 1){prg.tick();}
  if(runCount == 2){prg.tick();}
  if(runCount == 3){prg.tick();}
  if( ! (details.length >= 1 )){
    if(dbg.flags.log_running){
//      console.log('run', basename);
    }
  }

  var myFile = fs.createWriteStream(cfg.compiler.build_path + basename + '.txt');
//  var errFile = fs.createWriteStream(cfg.compiler.build_path + basename + '.err');
  var child = spawn(cmd, args);

  if(dbg.flags.log_run){
    console.log('', runCount, 'child:', basename);
  }

  child.stdout.pipe(myFile);//, { end: false });

  myFile.on('finish', function() {
    if(killed){
      return;
    }
    else if(details.length >= 1) {
      exports.run(details, basename, ++runCount, reporter);
    }
      else{
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
    if( ! (details.length >= 1)) {
    };
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

