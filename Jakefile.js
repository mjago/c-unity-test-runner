util = require('util');

var reporter = ' --reporter progress';

desc('Tasks (default)');
task('default', {async: false}, function () {
  console.log('Task List:');
  var cmd = 'jake -T';
  jake.exec(cmd, {printStdout: true, printStderr: true}, function () {
//    complete();
  });
});

desc('Test Jake:');
task('testjake', {async: true}, function () {
  var cmds = [
    'node /usr/local/lib/node_modules/jake/test/parseargs.js'+ reporter,
    'node /usr/local/lib/node_modules/jake/test/task_base.js'+ reporter,
    'node /usr/local/lib/node_modules/jake/test/file_task.js'+ reporter
  ];
  jake.exec(cmds, {printStdout: true, printStderr: true}, function () {
    console.log('Jake tests pass.');
    complete();
  });
});

desc('Run C Unity Test Runner:');
task('run', {async: false}, function () {
  var cmds = [
    'node ./index.js'
  ];
  jake.exec(cmds, {printStdout: true, printStderr: true}, function () {
    complete();
  });
});

desc('Test C Unity Test Runner:');
task('test', {async: false}, function () {
  var cmds = [
    'mocha ./test_runner.js'+ reporter
  ];
  jake.exec(cmds, {printStdout: true, printStderr: true}, function () {
    complete();
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
