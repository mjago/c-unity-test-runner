
var fs              = require('fs');
var path            = require('path');
var Mocha           = require('mocha');
var sys             = require('sys');
var clc             = require('cli-color');
var bar             = require('./progress.js');
var testRunner      = require('./build_test_runner.js');
var spawner         = require('./spawner.js');
var cfg             = require("./gcc.js");
var dbg             = require('./debug.js');
var report          = require('./report');
var clean           = require('./clean');
var data            = {headers: [], includedCFiles: []};
var mocha           = new Mocha();
var testFileSize    = 0;
var filesProcessed  = 0;

exports.runTests = function(){
  Promise.resolve(cleanSync())
    .then(buildUnity())
    .then(findTests(function(base){
      buildTestsSync(base)
    }))
//       buildTests(base);
    .then(findRequisiteCFiles(function(){
//      console.log('data.includedCFiles', data.includedCFiles);
    }))
    .then(buildRequisiteCFiles())
    .then(findTests(function(base){
      buildTestsSync(base);
       buildTests(base);
    }))
    .catch(function(error){
      console.error(error);
    });
};

function requisiteCArgs(cFile){
  return ['/Users/martyn/_unity_quick_setup/src/' + cFile + '.c', '-DUNITY_INCLUDE_DOUBLE', '-DUNITY_SUPPORT_TEST_CASES', '-DUNITY_SUPPORT_64', '-DTEST', '-c', '-m64', '-Wall', '-Wno-address', '-std=c99', '-pedantic', '-Wextra', '-Werror', '-Wpointer-arith', '-Wcast-align', '-Wwrite-strings', '-Wswitch-default', '-Wunreachable-code', '-Winit-self', '-Wmissing-field-initializers', '-Wno-unknown-pragmas', '-Wstrict-prototypes', '-Wundef', '-Wold-style-definition', '-Isrc/', '-I../src/', '-Itests/', '-o/Users/martyn/_unity_quick_setup/dev/Unity/test/build/' + cFile + '.o'];
}

function buildRequisiteCFiles(){
  var details = [];
  var temp = [];
  var basename;
  for(var count = 0; count < data.includedCFiles.length; count++){
    basename = path.basename(data.includedCFiles[count], '.c');
    temp.push(requisiteCArgs(basename));
//    console.log('temp', temp);
    details = temp;
    details.unshift(compilerExec());
//    details.push(compilerExec());
//    details.push(runnerArgs(basename));
//    details.push(linkerExec());
//    details.push(linkerDetails(basename));
//    details.push(linkerDestination(basename));//compilerBuildPath() + basename + '.exe');
//    details.push(data.includedCFiles[count]);
    spawner.run(details, basename, 0, function(){});
  data.includedCFiles = [];
  }
}


function findRequisiteCFiles(callback){
  var dirs = cfg.compiler.includes.items,
      cFiles = [];
  var headers = [];
  headers = headers.concat.apply(headers, data.headers);
  for(var dirCount = 0; dirCount < dirs.length; dirCount++){
    var tempFiles = (fs.readdirSync('' + dirs[dirCount]));
    for(var fileCount = 0; fileCount < tempFiles.length; fileCount++){
      var cBase = path.basename(tempFiles[fileCount], '.c');
      for(var hCount = 0; hCount < headers.length; hCount++){
        var hBase = removeIncludeMarkers(headers[hCount]);
        if(hBase === cBase && cBase !== 'unity'){
          data.includedCFiles.push('' + dirs[dirCount] + tempFiles[fileCount]);
        }
      }
    }
  }
  callback();
}
 
function findTests(buildtests_cb){
  var files      = fs.readdirSync(unitTestsPath());
  var filenames  = getTestFilenames(files);
  var bases      = basenames(filenames);
  var foundCount = 0;
  testFileSize = bases.length;
  bar.init(testFileSize);
  bases.map(function(currentValue){
    buildtests_cb(currentValue, foundCount++);
  });
}

function buildTests(base){
  var args = '';
  dbg.building(base);
  bar.update('runner');
  mochaAddFile(base);
  buildRunners(base, function () {
    reporter(base);
  });
}

//findRequisiteCFiles(function(){
//
//  var details = [];
//      console.log('data.includedCFiles', data.includedCFiles);
//  //    data.includedCFiles.forEach(function(val){
//    //    details = []
//    //    val = data.includedCFiles[1];
//    //    basename = path.basename(val, '.c');
//    //      console.log('val', val);
//    //      console.log(cfg.compiler.options + val)
//    //    cfg.compiler.defines.items.forEach(function(v){
//    //      args += '-D' + v;
//    //      details.push('-D' + v);
//    //    });
//    //    cfg.compiler.options.forEach(function(v){
//    //        console.log('v',v)
//    //      args += v;
//    //      details.push(v);
//    //    });
//    //    console.log('details', details);
//    //    args += ', ' + val;
//    //    details.push(val);
//    //    details.push(objectPrefix() +
//    //                 compilerObjectFilesDest() +
//    //                 basename + objectFilesExtension());
//
//    //    details.push(compilerExec());
//    //    details.push([args]);
//    //      console.log('details', details)
//    //    spawner.run(['gcc',details, 'gcc', ['-lm','-m64',
//    //                                        objectPath(cfg.runner.name),
//    //                                        objectPath(basename),
//    //                                        objectPath(basename + runnerName()),
//    //                                        objectDestination(basename)]]
//    //                                        , basename, 0, function(){});
//    //  });
//    //  });
//    //  buildCRequisites();
//});

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
    ui(cfg.mocha.ui).
    reporter(cfg.mocha.reporter).
    run(function(failures){
      process.on('exit', function() {
        process.exit(failures);
      });
    });
}

function mochaAddFile(base){
  mocha.addFile(
    path.join(compilerBuildPath(), base + '.js'));
}

function removeIncludeMarkers(header){
  return path.basename('' + header
                       .replace(/"/g, '')
                       .replace(/</g, '')
                       .replace(/>/g, ''), '.h');

}

function buildTestsSync(basename){
  var dirs = fs.readdirSync(unitTestsPath());
  var headers = testRunner
        .build(unitTestsPath() + basename + '.c',
               compilerBuildPath() + createRunnerName(basename));
  data.headers.push(headers);
}

function spawnRunner(details, basename, reporter){
  spawner.run(details, basename, 0, reporter);
}

function buildUnity(){
  var details = [];
  var basename = 'unity';
  var reporter = null;
//  if(count > 0) return details;
  details.push(compilerExec());
  details.push(runnerExecArgs());
//  return details;


//  var details = runnerExecDetailsMaybe(count);
//  details.push(compilerExec());
//  details.push(sourceArgs(basename));
//  details.push(compilerExec());
//  details.push(runnerArgs(basename));
//  details.push(linkerExec());
//  details.push(linkerDetails(basename));
//  details.push(linkerDestination(basename));
  spawnRunner(details, basename, function(){});
}

function buildRunners(basename, reporter){
  var details = []; // runnerExecDetailsMaybe(count);
  details.push(compilerExec());
  details.push(sourceArgs(basename));
  details.push(compilerExec());
  details.push(runnerArgs(basename));
  details.push(linkerExec());
  details.push(linkerDetails(basename));
  details.push(linkerDestination(basename));//compilerBuildPath() + basename + '.exe');
  spawnRunner(details, basename, reporter);
}

function runnerExecDetailsMaybe(count){
  var details = [];
  if(count > 0) return details;
  details.push(compilerExec());
  details.push(runnerExecArgs());
  return details;
}

function compilerExec(){
  return cfg.compiler.path + cfg.compiler.exec;
}

function linkerExec(){
  return cfg.linker.path + cfg.linker.exec;
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
  return (objectFilesPath() + name + objectFilesExtension());
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

function unitTestsPath(){
  return cfg.compiler.unit_tests_path;
}

function outputR(basename, args) {
  args.push(objectPrefix() +
            compilerObjectFilesDest() +
            basename + '_Runner.o');
  return args;
}

function sourceR(basename, args){
  args.push(compilerBuildPath() +
            basename + '_Runner.c');
  return args;
}

function output(basename, args) {
  args.push(objectPrefix() +
            compilerObjectFilesDest() +
            basename + objectFilesExtension());
  return args;
}

function source(basename, args){
  args.push(unitTestsPath() + basename +
            sourceFilesExtension());
  return args;
}

function options(args){
  return args.concat(args, compilerOptions()
                     .map(function(cV){return cV;}));
}

function definesItems(){
  return(cfg.compiler.defines.items);
}

function defines(){
  return definesItems().map(function(cV){
    return(definesPrefix() + cV);
  });
}

function includesItems(){
  return(cfg.compiler.includes.items);
}

function includesPrefix(){
  return(cfg.linker.includes.prefix);
}

function definesPrefix(){
  return (cfg.compiler.defines.prefix);
}

function objectPrefix(){
  return(cfg.compiler.object_files.prefix);
}

function includes(args){
  return args.concat(args, includesItems()
                     .map(function(cV){
    return(includesPrefix() + cV);
  }));
}

function compilerOptions(){
  return(cfg.compiler.options);
}

function compilerObjectFilesDest(){
  return (cfg.compiler.object_files.destination);
}

function compilerBuildPath(){
  return cfg.compiler.build_path;
}

function sourceFilesExtension(){
  return cfg.compiler.source_files.extension;
}

function objectFilesExtension(){
  return cfg.compiler.object_files.extension;
}

function objectFilesPath(){
  return cfg.linker.object_files.path;
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
  args.push(objectPrefix() +
            compilerBuildPath() +
            cfg.runner.object);
  return args;
}

function createRunnerName(sourceName){
  var ext = path.extname(sourceName);
  var runner = sourceName + '_Runner.c';
  return runner;
}

function runnerName(){
  return('_Runner');
}

//todo
function linkerDetails(basename){
  return ['-lm',
          '-m64',
          '/Users/martyn/_unity_quick_setup/dev/Unity/test/build/file_1.o',
          objectPath(cfg.runner.name),
          objectPath(basename),
          objectPath(basename + runnerName()),
          objectDestination(basename)];
}

function cleanSync()
{
  clean.clean(compilerBuildPath());
//    setTimeout(resolve, interval);
}

this.runTests();

module.exports = {
  data: data,

  removeIncludeMarkers: removeIncludeMarkers,
  runnerExecDetailsMaybe: runnerExecDetailsMaybe,
  compilerExec: compilerExec,
  linkerExec: linkerExec,
  runnerExecArgs: runnerExecArgs,
  requisiteCArgs: requisiteCArgs,
  sourceArgs: sourceArgs,
  runnerArgs: runnerArgs,
  objectPath: objectPath,
  isTestFile: isTestFile,
  isCFile: isCFile,
  getTestFilenames: getTestFilenames,
  basenames: basenames,
  unitTestsPath: unitTestsPath,
  findTests: findTests,
  findRequisiteCFiles: findRequisiteCFiles,
  outputR: outputR,
  sourceR: sourceR,
  output: output,
  source: source,
  options: options,
  definesItems: definesItems,
  defines: defines,
  includesItems: includesItems,
  includesPrefix: includesPrefix,
  definesPrefix: definesPrefix,
  objectPrefix: objectPrefix,
  includes: includes,
  compilerOptions: compilerOptions,
  compilerObjectFilesDest: compilerObjectFilesDest,
  compilerBuildPath: compilerBuildPath,
  sourceFilesExtension: sourceFilesExtension,
  objectFilesExtension: objectFilesExtension,
  objectFilesPath: objectFilesPath,
  objectDestination: objectDestination,
  linkerDestination: linkerDestination,
  runnerExecSource: runnerExecSource,
  runnerExecOutput: runnerExecOutput,
  createRunnerName: createRunnerName,
  runnerName: runnerName,
  linkerDetails: linkerDetails
};
