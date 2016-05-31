var Promise = require('bluebird'),
    fs              = require('fs'),
    _               = require('lodash'),
    path            = require('path'),
    Mocha           = require('mocha'),
    clc             = require('cli-color'),
    bar             = require('./progress.js'),
    testRunner      = require('./build_test_runner.js'),
    spawner         = require('./spawner.js'),
    cfg             = require("./gcc.js"),
    dbg             = require('./debug.js'),
    report          = require('./report'),
    clean           = require('./clean'),
    data            = {headers: [], includedCFiles: [], bases: []},
    mocha           = new Mocha(),
    testFileSize    = 0,
    filesProcessed  = 0,
    moment          = require('moment');


exports.runTests = function(){
  cleanSync();
  console.log('building unity');
  buildUnity()
    .then(function(res){
      console.log(moment().format("hh.mm.ss"), 'finding tests');
      return findTests();
    })
    .then(function(res){
      console.log(moment().format("hh.mm.ss"), 'building tests');
      return buildTestsSync();
    })
    .then(function(res){
      console.log('\n', moment().format("hh.mm.ss"), 'finding files');
      return findRequisiteCFiles();
    })
    .then(function(res){
      console.log(moment().format("hh.mm.ss"), 'building requisites');
      return buildRequisiteCFiles();
    })
    .then(function(res){
      console.log(moment().format("hh.mm.ss"), 'building tests 2');
      return buildTests();
    })
    .catch(function(error){
      console.log(moment().format("hh.mm.ss"), '*** CAUGHT ERROR! ***');
      if(error) console.log('Error:', error);
    });
};

function awaitFileExistance(file){
  console.log(file);
  var x = 0;
  return new Promise(function(resolve, reject){
    var int = setInterval(function(){
      //      console.log('x', x);
      if(++x === 200){
        clearInterval(int);
        //        console.log('x === 200',x );
        reject('Error: timed out!');
         ;
      }
      fs.lstat(file,
               function(err, stats) {
                 if(!err && stats.isFile()) {
                   resolve('resolved');
                   clearInterval(int);
                 };
               });
    }, 10);
  });
}

function findRequisiteCFiles(){
  var dirs    = cfg.includesItems,
      cFiles  = [],
      headers = [];
  headers = _.uniq(headers.concat.apply([], data.headers));
  dirs.map(function(dir){
    var tempFiles = (fs.readdirSync('' + dir));
    tempFiles.map(function(temp){
      var cBase = path.basename(temp, '.c');
      headers.map(function(header){
        var hBase = removeIncludeMarkers(header);
        if(hBase === cBase && cBase !== 'unity'){
          data.includedCFiles.push('' + dir + temp);
        }
      });
    });
  });
}

function requisiteCArgs(cFile){
  details = ['/Users/martyn/_unity_quick_setup/src/' + cFile + '.c']
    .concat(includes(defines()))
    .concat(testDefine())
    .concat(compilerOptions())
    .concat(['-o/Users/martyn/_unity_quick_setup/dev/Unity/test/build/' + cFile + '.o']);
  return details;
}

function testDefine(){
  return [cfg.definesPrefix +
          cfg.compiler.test_define];
}

// function findTests(){
//   var files      = fs.readdirSync(unitTestsPath());
//   var filenames  = getTestFilenames(files);
//   var foundCount = 0;
//   data.bases     = basenames(filenames);
//   testFileSize = data.bases.length;
//   bar.init(testFileSize);
// }

function findTests(res){
  return new Promise(function(resolve, reject){
    var files = fs.readdir(cfg.unitTestsPath, function(err, files){
      if(err){
        console.log('rejected')
        reject("Error: Can't find tests:", err);
      }
      else{
        var filenames  = getTestFilenames(files);
        var foundCount = 0;
        data.bases     = basenames(filenames);
//        console.log('data.bases', data.bases)
        testFileSize = data.bases.length;
        bar.init(testFileSize);
        resolve('found');
      }
    });
  });
}

function buildTests(){
//  console.log('here');
  var args = '';
  data.bases.map(function(base){
    dbg.building(base);
    bar.update('runner');
    mochaAddFile(base);
    buildRunners(base, function () {
      reporter(base);
    });
  });
}

function reporter(base){
  bar.update('runner');
  var result = report.run(base, function(){
  });
  dbg.log('resultJS', 'built result ' + result);
  if (result){
    mochaRunMaybe();
  }
}

function mochaRunMaybe(){
  if(++filesProcessed == testFileSize){
    dbg.log('resultJS', 'running Mocha');
    mochaRun();
  };
}

function mochaRun(){
  mocha.
    ui(cfg.mochaUI).
    reporter(cfg.mochaReporter).
    run(function(failures){
      process.on('exit', function() {
        process.exit(failures);
      });
    });
}

function mochaAddFile(base){
  mocha.addFile(
    path.join(cfg.compilerBuildPath, base + '.js'));
}

function removeIncludeMarkers(header){
  return path.basename('' + header
                       .replace(/"/g, '')
                       .replace(/</g, '')
                       .replace(/>/g, ''), '.h');
}

function buildTestsSync(){
  return new Promise(function(resolve, reject){
    for(var count = 0; count < data.bases.length; count++){
      var basename = data.bases[count];
      var headers = testRunner
            .build(cfg.unitTestsPath +
                   basename +
                   '.c',
                   cfg.compilerBuildPath +
                   createRunnerName(basename),
                   function(){
                     if(count === data.bases.length - 1){
                       resolve();
                     }
                   });
      data.headers = data.headers.concat(headers);
    }
  });
}

function spawnRunner(details, basename, reporter){
  spawner.run(details, basename, 0, reporter);
}

function buildUnity(){
  var details = [];
  var basename = 'unity';
  var reporter = null;
  details.push(cfg.compilerExec);
  details.push(runnerExecArgs());
  spawnRunner(details, basename, function(){});
  return awaitFileExistance(cfg.compilerBuildPath + cfg.runner.object + '');
}

function buildRequisiteCFiles(){
  var details = [];
  var basename;
//  console.log('data.includedCFiles', data.includedCFiles)
  return new Promise(function(resolve, reject){
    if(data.includedCFiles.length < 1){
      resolve('no files');
//      console.log('NO FILES');
    }
    else {
      data.includedCFiles.map(function(inc){
        basename = path.basename(inc, '.c');
        details.push(cfg.compilerExec);
        details.push(requisiteCArgs(basename));
        spawner.run(details, basename, 0, resolve);
      });
    }
  });
//  data.includedCFiles = [];
}

function buildRunners(basename, reporter){
  var details = []; // runnerExecDetailsMaybe(count);
  details.push(cfg.compilerExec);
  details.push(sourceArgs(basename));
  details.push(cfg.compilerExec);
  details.push(runnerArgs(basename));
  details.push(cfg.linkerExec);
  details.push(linkerDetails(basename));
  details.push(linkerDestination(basename));//compilerBuildPath() + basename + '.exe');
  spawnRunner(details, basename, reporter);
}

function runnerExecDetailsMaybe(count){
  var details = [];
  if(count > 0) return details;
  details.push(cfg.compilerExec);
  details.push(runnerExecArgs());
  return details;
}

function runnerExecArgs(){
  return runnerExecOutput(runnerExecSource(options(includes(defines()))));
}

function sourceArgs(basename){
  return output(basename, source(basename, options(includes(defines()))));
}

function runnerArgs(basename){
  return outputR(basename, sourceR(basename, options(includes(defines()))));
  return details;
}

function objectPath(name){
  return (cfg.objectFilesPath + name + cfg.objectFilesExtension);
}

function isTestFile(name){
  return (name.indexOf('test') === 0) ||
    (name.indexOf('Test') === 0);
}

function isCFile(name){
  return (path.extname(name) === '.c') || (path.extname(name) === '.C');
}

function getTestFilenames(files){
  var testFiles = [];
  testFiles = files.filter(function(element, index, array) {
    return ((isCFile(element)) &&
            (isTestFile(element)));
  });
  return testFiles;
}

function basenames(files){
  var testFiles =files.map(function(currentValue){
    return path.basename(currentValue, '.c');
  });
  return testFiles;
}

function outputR(basename, args) {
  args.push(cfg.objectPrefix +
            cfg.compilerObjectFilesDest +
            basename + '_Runner.o');
  return args;
}

function sourceR(basename, args){
  args.push(cfg.compilerBuildPath +
            basename + '_Runner.c');
  return args;
}

function output(basename, args) {
  args.push(cfg.objectPrefix +
            cfg.compilerObjectFilesDest +
            basename + cfg.objectFilesExtension);
  return args;
}

function source(basename, args){
  args.push(cfg.unitTestsPath + basename +
            cfg.sourceFilesExtension);
  return args;
}

function options(args){
  return args.concat(args, cfg.compilerOptions
                     .map(function(cV){return cV;}));
}

function defines(){
  return cfg.definesItems.map(function(cV){
    return(cfg.definesPrefix + cV);
  });
}

function includes(args){
  return args.concat(args, cfg.includesItems
                     .map(function(cV){
                       return(cfg.includesPrefix + cV);
                     }));
}

function objectDestination(name){
  return (cfg.linker.bin_files.prefix + cfg.linker.bin_files.destination
          + name + cfg.linker.bin_files.extension);
}

function linkerDestination(name){
  return(cfg.linker.bin_files.destination +
         name + cfg.linker.bin_files.extension);
}

function runnerExecSource(args) {
  args.push(cfg.runner.source_path + cfg.runner.sourceName);
  return args;
}

function runnerExecOutput(args) {
  args.push(cfg.objectPrefix +
            cfg.compilerBuildPath +
            cfg.runner.object);
  return args;
}

function createRunnerName(sourceName){
  var ext = path.extname(sourceName);
  var runner = sourceName + '_Runner.c';
  return runner;
}

//todo
function linkerDetails(basename){
  details = ['-lm',
             '-m64'];
  if(data.includedCFiles.length > 0){
    details.push('/Users/martyn/_unity_quick_setup/dev/Unity/test/build/file_1.o');
  }
  details.push(objectPath(cfg.runner.name),
               objectPath(basename),
               objectPath(basename + cfg.runnerName),
               objectDestination(basename));
  return details;
}

function cleanSync()
{
  clean.clean(cfg.compilerBuildPath);
}

this.runTests();

module.exports = {
  data: data,

  removeIncludeMarkers: removeIncludeMarkers,
  runnerExecDetailsMaybe: runnerExecDetailsMaybe,
  compilerExec: cfg.compilerExec,
  linkerExec: cfg.linkerExec,
  runnerExecArgs: runnerExecArgs,
  requisiteCArgs: requisiteCArgs,
  sourceArgs: sourceArgs,
  runnerArgs: runnerArgs,
  objectPath: objectPath,
  isTestFile: isTestFile,
  isCFile: isCFile,
  getTestFilenames: getTestFilenames,
  basenames: basenames,
  unitTestsPath: cfg.unitTestsPath,
  findTests: findTests,
  findRequisiteCFiles: findRequisiteCFiles,
  outputR: outputR,
  sourceR: sourceR,
  output: output,
  source: source,
  options: options,
  defines: defines,
  includes: includes,
  objectDestination: objectDestination,
  linkerDestination: linkerDestination,
  runnerExecSource: runnerExecSource,
  runnerExecOutput: runnerExecOutput,
  createRunnerName: createRunnerName,
  runnerName: cfg.runnerName,
  linkerDetails: linkerDetails,
  definesItems: cfg.definesItems,
  includesItems: cfg.includesItems,
  includesPrefix: cfg.includesPrefix,
  definesPrefix: cfg.definesPrefix,
  objectPrefix: cfg.objectPrefix,
  compilerOptions: cfg.compilerOptions,
  compilerObjectFilesDest: cfg.compilerObjectFilesDest,
  compilerBuildPath: cfg.compilerBuildPath,
  sourceFilesExtension: cfg.sourceFilesExtension,
  objectFilesExtension: cfg.objectFilesExtension,
  objectFilesPath: cfg.objectFilesPath,
};
