var sem             = require('semaphore')(2);

exports.run = function (details, basename, runCount){

  sem.take(function() {

    run(details, basename, runCount);

    sem.leave();
  });
};

var clc    = require('cli-color');
var spawn  = require ('child_process').spawn;
var fs     = require('fs');
var report = require('./report');
var cfg    = require('./gcc.js').data();
var dbg    = require('./debug.js')
var run = function (details, basename, runCount){
  var cmd = details.shift();
  var args = details.shift();
  if( ! (details.length >= 1 )){
    if(dbg.flags.log_running){
      console.log('run', basename);
    }
  }

//  console.log(cmd, args)
  var myFile = fs.createWriteStream(cfg.compiler.build_path + basename + '.txt');
  var child = spawn(cmd, args);
//  var pid = spawn('grep', ['ssh']).pid;

  if(dbg.flags.log_run){
    console.log('', runCount, 'child:', basename);
  }

  child.stdout.pipe(myFile);//, { end: false });

  myFile.on('finish', function() {
    if(details.length >= 1) {
      exports.run(details,basename, ++runCount);
    }
    else{
      report.run(myFile, basename);
    }
  });

  child.on('exit', function (data) {
    if( ! (details.length >= 1)) {
//      myFile.end();
    };
    if(data === 0)
    {
      if(dbg.flags.log_exit){
        console.log(clc.green(runCount, 'exit: ' + data, basename));
      }

//      if(details.length > 1){
//        exports.run(details,basename);
//      }
//      else{
//        console.timeEnd('async');
//        report.run(basename);
////        process.exit(data);
//      }
    }
    else
    {
      if(dbg.flags.log_exit){
        console.log(clc.red(runCount, 'exit: ' + data, basename));
      }
//      throw new Error('invalid exit code! \n' + err);
    }
  });

  child.on('close', function (data) {
    if(dbg.flags.log_close){
      console.log(clc.green(runCount, 'close: ' + data, basename));
    }
  });
};

