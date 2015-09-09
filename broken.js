var clc    = require('cli-color');
var spawn  = require ('child_process').spawn;
var fs     = require('fs');

exports.run  = function (details, outFile){
  var cmd    = details.shift();
  var args   = details.shift();
  var myFile = fs.createWriteStream(outFile);
  var child  = spawn(cmd, args);
  var pid;

  grep  = spawn('grep', ['ssh']);
  pid = grep.pid;
  child.stdout.pipe(process.stdout, { end: false });
  child.stdout.pipe(myFile);
  process.stdin.resume();
  process.stdin.pipe(child.stdin, { end: false });
  process.stdin.pipe(myFile);

  console.log('Child pid:', pid);

  child.stdin.on("end", function() {
    console.log("end", pid);
  });

  child.on('exit', function (data) {
////    if(data !== null)
////    {
//    if(details.length !== 0) {
//      exports.run(details, outFile);
//    }
//    else {
//    console.log(clc.green('exit:', pid));
////      process.close(data);
//    }
////    }
////    else
////    {
////      console.log(clc.red('exit: ' + data, pid));
////    }
//
//
//    //    if(data == '0')
//    //    {
//    ////      console.log(clc.green('exit: ' + data));
//    //    }
//    //    else
//    //    {
//    //      console.log(clc.red('exit: ' + data));
//    //    }
  });

  child.on('close', function (data) {
//    console.log(clc.green('close: ' + data, pid));
    if(details.length > 0) {
      exports.run(details, outFile);
    }
    else {
      console.timeEnd('async');
    }
  });
};

exports.run_working = function (details){
  count = 1;
//  var testCount = details.shift();
  var cmd = details.shift();
  var args = details.shift();
  //  console.log('top of spawner');
  //  console.log('cmd', cmd);
  //  console.log('details', details);
  //  var x = fs.createWriteStream('myOutput.txt');
  //  console.log('spawner: cmd = ', cmd)
  var child = spawn(cmd, args,{
    stdio: [
      0,      // use parents stdin for child
      'pipe', // pipe child's stdout to parent
      'pipe'  // direct child's stderr to a file
    ]});

//  console.log('Connected: ' + child.connected);

  grep  = spawn('grep', ['ssh']);
  console.log('Spawned child pid: ' + grep.pid);

  child.stdout.on('data', function (data) {
    //    console.log('data');
//    stdout += data;
  });

  child.stderr.on('data', function (data) {
    console.log(clc.red('stderr: ' + data));
  });

  child.on('exit', function (data) {
    if(data === 0)
    {
      if(details.length > 1){
      }
      else{
//        console.log(clc.cyan(stdout));
        //        var ary = stdout.split('\n');
        //        for(var count = 0; count < ary.length; ary++){
        //          if(1){//ary[count].indexOf('test_t1') === 0){
        //            console.log(clc.cyan('' + ary.shift() + '\n\n'));
        //            stdout = '';
        //          }
      }
      if(details.length > 1){
        exports.run(details);
      }
      else{
        //        fs.writeFile('out', stdout + '****************************************************************\n\n', null);
        //        console.log(stdout + '*******************************************************************************\n\n');
        //        var ary = stdout.split('\n');
        //        for(var count = 0; count < ary.length; ary++){
        //          if(1){//ary[count].indexOf('test_t1') === 0){
        //            console.log(clc.cyan('' + ary.shift() + '\n\n'));
        //            stdout = '';
        //          }
        //        }
      }
      //      fs.writeFile('out', stdout + '*****************************************************************\n\n', null);

      console.log(clc.green('exit: ' + data));

      //console.timeEnd('async');
    }
    else
    {
      console.log(clc.red('exit: ' + data));
    }
    //    if(data == '0')
    //    {
    ////      console.log(clc.green('exit: ' + data));
    //    }
    //    else
    //    {
    //      console.log(clc.red('exit: ' + data));
    //    }
  });

  child.on('close', function (data) {
  });
};





////var tests  = ['t0.exe','t1.exe','t2.exe','t3.exe',
////              't4.exe','t5.exe','t6.exe','t7.exe',
////              't8.exe','t9.exe','ta.exe','tb.exe',
////              'tc.exe','td.exe','te.exe','tf.exe'];
//
//var path   = '../../_unity_quick_setup/dev/Unity/test/build/';
//
//
//var tests  = ['test_t0.exe', 'test_t1.exe', 'test_t2.exe', 'test_t2.exe', 'test_t3.exe']; //todo
//
//
//var multiTests = [];
//
//for(count = 0; count < 100; count++){
//  multiTests = multiTests.concat(tests);
//}
//
//var details = [];
//for(count = 0; count < multiTests.length; count++)
//{
//  details.push(multiTests[count]);
//  details.push(['']);
//}
//exports.run(details);
