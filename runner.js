var _               = require('lodash');
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
var data            = {headers: [], includedCFiles: [], bases: []};
var mocha           = new Mocha();
var testFileSize    = 0;
var filesProcessed  = 0;

exports.runTests = function(){
  var count;
  Promise.resolve(cleanSync())
    .then(buildUnity())
    .then(findTests())
    .then(buildTestsSync())
    .then(findRequisiteCFiles())
    .then(buildRequisiteCFiles())
    .then(buildTests())
    .catch(function(error){
      console.error(error);
    });
};

function findRequisiteCFiles(){
  var dirs    = cfg.compiler.includes.items,
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
  return [cfg.compiler.defines.prefix +
          cfg.compiler.test_define];
}

function buildRequisiteCFiles(){
  var details = [];
  var basename;
  data.includedCFiles.map(function(inc){
    basename = path.basename(inc, '.c');
    details.push(compilerExec());
    details.push(requisiteCArgs(basename));
    spawner.run(details, basename, 0, function(){});
  });
  data.includedCFiles = [];
}

function findTests(){
  var files      = fs.readdirSync(unitTestsPath());
  var filenames  = getTestFilenames(files);
  var foundCount = 0;
  data.bases     = basenames(filenames);
  testFileSize = data.bases.length;
  bar.init(testFileSize);
}

function buildTests(){
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

function buildTestsSync(){
  var dirs = fs.readdirSync(unitTestsPath());
  data.bases.map(function(basename){
    var headers = testRunner
          .build(unitTestsPath() +
                 basename +
                 '.c',
                 compilerBuildPath() +
                 createRunnerName(basename));
    data.headers.push(headers);
  });
}

function spawnRunner(details, basename, reporter){
  spawner.run(details, basename, 0, reporter);
}

function buildUnity(){
  var details = [];
  var basename = 'unity';
  var reporter = null;
  details.push(compilerExec());
  details.push(runnerExecArgs());
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
