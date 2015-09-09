var fs              = require('fs');
var path            = require('path');
var testRunner      = require('./buildTestRunner.js');
var spawner         = require('./spawner.js');
var cfg             = require("./gcc.js").data();
var clc             = require('cli-color');
var sys             = require('sys');
var dbg             = require('./debug.js');
var procs           = 0;

function buildTests(basename){
  var dirs   = fs.readdirSync('/Users/martyn/_unity_quick_setup/dev/Unity/test/tests/');
  testRunner.build(cfg.compiler.unit_tests_path + basename + '.c',
                   cfg.compiler.build_path + createRunnerName(basename));
}

function findTests(){
  files = [];
  var dirs = fs.readdirSync(cfg.compiler.unit_tests_path);
  for(var count = 0; count < dirs.length; count++){
    if(path.extname(dirs[count]) === '.c'){
      var base = path.basename(dirs[count], '.c');
      if(base.indexOf('test') === 0){
        files.push(base);
      }
    }
  }
  return files;
}

function findTest(runtest){
  files = [];
  var foundCount = 0;
  var dirs = fs.readdirSync(cfg.compiler.unit_tests_path);
  for(var count = 0; count < dirs.length; count++){
    if(path.extname(dirs[count]) === '.c'){
      var base = path.basename(dirs[count], '.c');
      if(base.indexOf('test') === 0){
        if(dbg.flags.log_timers){
          console.time(base);
        }
        if(dbg.flags.log_build){
          console.log('finding', base);
        }
        runtest(base, foundCount++);
      }
    }
  }
}

exports.runTests = function(report){
  clean();
  findTest(function(base, count){
    if(dbg.flags.log_build){
      console.log('building', base);
    }
    buildTests(base);

    runGcc(base, count);

  });
};

function runGcc(name, count){
  var basename = name;

  details = [];
  if(count == 0){
    details.push('gcc');
    details.push(unityOutput(unitySource(options(includes(defines())))));
  }
  details.push('gcc');
  details.push(output(basename, source(basename, options(includes(defines())))));
  details.push('gcc');
  details.push(outputR(basename, sourceR(basename, options(includes(defines())))));
  details.push('gcc');
  details.push(
    ['-lm','-m64',
     cfg.linker.object_files.path + 'unity' + cfg.compiler.object_files.extension,
     cfg.linker.object_files.path + basename + cfg.compiler.object_files.extension,
     cfg.linker.object_files.path + basename + '_Runner' + cfg.compiler.object_files.extension,
     cfg.linker.bin_files.prefix + cfg.linker.bin_files.destination
     + basename + cfg.linker.bin_files.extension]);
  details.push(
    cfg.linker.bin_files.destination +
      basename + cfg.linker.bin_files.extension);
  details.push(['']);
//  details.push(basename);
  spawner.run(details, basename, 0);
}

function rmDir(dirPath, removeSelf) {
  if (removeSelf === undefined)
    removeSelf = true;
  try {
    var files = fs.readdirSync(dirPath);
  }
  catch(e) { return; }
  if (files.length > 0)
    for (var i = 0; i < files.length; i++) {
      if(dbg.flags.log_clean){
        console.log('cleaning', files[i]);
      }
      var filePath = dirPath + '/' + files[i];
      if (fs.statSync(filePath).isFile())
        fs.unlinkSync(filePath);
      else
        rmDir(filePath);
    }
  if (removeSelf)
    fs.rmdirSync(dirPath);
};

function createRunnerName(sourceName){
  var ext = path.extname(sourceName);
  var runner = sourceName + '_Runner.c';
  return runner;
}

function defines() {
  var args = [];
  var defs = cfg.compiler.defines.items;
  for(count = 0; count < defs.length; count++){
    args.push(cfg.compiler.defines.prefix + defs[count]);
  }
  return args;
}

function includes(args){
  var incs = cfg.compiler.includes.items;
  for(count = 0; count < incs.length; count++){
    args.push(cfg.compiler.includes.prefix + incs[count]);
  }
  return args;
}

function options(args){
  var opts = cfg.compiler.options;
  for(count = 0; count < opts.length; count++){
    args.push(opts[count]);
  }
  return args;
}

function source(basename, args){
  args.push(cfg.compiler.unit_tests_path + basename + '.c');
  return args;
}

function output(basename, args) {
  args.push(cfg.compiler.object_files.prefix +
            cfg.compiler.object_files.destination +
            basename + cfg.compiler.object_files.extension);
  return args;
}

function sourceR(basename, args){
  args.push(cfg.compiler.build_path + basename + '_Runner.c');
  return args;
}

function outputR(basename, args) {
  args.push(cfg.compiler.object_files.prefix + cfg.compiler.object_files.destination + basename + '_Runner.o');
  return args;
}

function unityOutput(args) {
  args.push(cfg.compiler.object_files.prefix +
            cfg.compiler.build_path + 'unity' +
            cfg.compiler.object_files.extension);
  return args;
}

function unitySource(args) {
  args.push(cfg.unity.source_path + cfg.name);
  return args;
}

function clean()
{
  rmDir(cfg.compiler.build_path, false);
}

function runBuildReport(build, run){
  run(report);
}

function build(){
  if(dbg.flags.log_build){
  console.log('build')
  }
}
function report(basename) {
}

runBuildReport(build, this.runTests); //todo


