util = require('util');

desc('This is the default task.');
task('default', [], function (params) {
  console.log('default placeholder:');
  console.log('arguments = ' + util.inspect(arguments));
});

desc('Test Jake:');
task('testjake', {async: true}, function () {
  var cmds = [
    'node /usr/local/lib/node_modules/jake/test/parseargs.js'
  , 'node /usr/local/lib/node_modules/jake/test/task_base.js'
  , 'node /usr/local/lib/node_modules/jake/test/file_task.js'
  ];
  jake.exec(cmds, {printStdout: true, printStderr: true}, function () {
    console.log('Jake tests passed.');
    complete();
  });
});

desc('Run C Unity Test Runner:');
task('run', {async: false}, function () {
  var cmds = [
    'node ./runner.js'
  ];
  jake.exec(cmds, {printStdout: true, printStderr: true}, function () {
//    complete();
  });
});

desc('Test C Unity Test Runner:');
task('test', {async: false}, function () {
  var cmds = [
    'mocha ./test_runner.js'
  ];
  jake.exec(cmds, {printStdout: true, printStderr: true}, function () {
//    complete();
  });
});

desc('Test all and Run:');
task('testall', ['default', 'testjake', 'test', 'run'], {async: false, printStdout: true, printStderr: true}, function () {
  });






desc('Watch js, Test and Run:');
watchTask(['test', 'run'], function () {
  this.watchFiles.include([
    './**/*.ejs'
  ]);
});
