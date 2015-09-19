var fs              = require('fs');
var path            = require('path');
var Mocha           = require('mocha');
var prg             = require('./progress.js');
var testRunner      = require('./buildTestRunner.js');
var spawner         = require('./spawner.js');
var cfg             = require("./gcc.js").data();
var clc             = require('cli-color');
var sys             = require('sys');
var dbg             = require('./debug.js');
var report          = require('./report');
var mocha           = new Mocha();
var testFileSize    = 0;
var data            = {headers: [], includedCFiles: []};

exports.runTests = function(){
  var filesProcessed = 0;
  cleanSync();

  findRequisiteCFiles();

  var files = findTests(function(base, count){
    if(dbg.flags.log_build){
      console.log('building', base);
    }
    prg.tick();
    mocha.addFile(
      path.join(cfg.compiler.build_path, base + '.js'));
    buildTestsSync(base);
    console.log('data.headers', data.headers);
    runGcc(base, count, function(){
      prg.tick();
      report.run(base, function(){
      });

      filesProcessed += 1;
      if(filesProcessed == testFileSize){
        mocha.
          ui('tdd').
          reporter('mochawesome').
          run(function(failures){
          process.on('exit', function () {
            process.exit(failures);
          });
        });
      };
    });
  });
  if(dbg.flags.log_timers){
    console.timeEnd(name);
  };
};

function findRequisiteCFiles(){
  var dirs = cfg.compiler.includes.items,
      cFiles = [];
  var headers = [];
  headers = headers.concat.apply(headers, data.headers);
  for(var dirCount = 0; dirCount < dirs.length; dirCount++){
    var tempFiles = (fs.readdirSync('' + dirs[dirCount]));
    for(var fileCount = 0; fileCount < tempFiles.length; fileCount++){
      var cBase = path.basename(tempFiles[fileCount], '.c');
      for(var hCount = 0; hCount < headers.length; hCount++){
        var hBase = path.basename('' + headers[hCount]
                                  .replace(/"/g, '')
                                  .replace(/</g, '')
                                  .replace(/>/g, ''), '.h');
        if(hBase === cBase){
          data.includedCFiles.push('' + dirs[dirCount] + tempFiles[fileCount]);
        }
      }
    }
  }
}

function buildTestsSync(basename){
  var dirs = fs.readdirSync('/Users/martyn/_unity_quick_setup/dev/Unity/test/tests/');
  var headers = testRunner
        .build(cfg.compiler.unit_tests_path + basename + '.c',
               cfg.compiler.build_path + createRunnerName(basename));
  data.headers.push(headers);
}

function findTests(runtestCallback){
  var foundCount = 0;
  var dirs = fs.readdirSync(cfg.compiler.unit_tests_path);
  var files = [];
  var count;
  if(dbg.flags.log_timers){console.time(base);}

  for(count = 0; count < dirs.length; count++){
    if(path.extname(dirs[count]) === '.c'){
      var base = path.basename(dirs[count], '.c');
      if(base.indexOf('test') === 0){
        files.push(base);
        testFileSize += 1;
      }
    }
  }

  if(dbg.flags.log_build){console.log('finding', base);}
  prg.init_bar(testFileSize);
  for(count = 0; count < testFileSize; count++){
    runtestCallback(files[count], foundCount++);
  }
}

function runGcc(name, count, reporter){
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
  spawner.run(details, basename, 0, reporter);
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

function cleanSync()
{
  rmDir(cfg.compiler.build_path, false);
}

function runMoch(){
  fs.readdirSync(cfg.compiler.build_path).filter(function(file){
    return file.substr(-3) === '.js';
  }).forEach(function(file){
    mocha.addFile(
      path.join(cfg.compiler.build_path, file)
    );
  });

  mocha.run(function(failures){
    process.on('exit', function () {
      process.exit(failures);
    });
  });
}

this.runTests();