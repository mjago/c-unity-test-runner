
var fs              = require('fs');
var path            = require('path');
var Mocha           = require('mocha');
var sys             = require('sys');
var clc             = require('cli-color');
var bar             = require('./progress.js');
var testRunner      = require('./buildTestRunner.js');
var spawner         = require('./spawner.js');
var cfg             = require("./gcc.js");
var dbg             = require('./debug.js');
var report          = require('./report');
var clean           = require('./clean');
var mocha           = new Mocha();
var testFileSize    = 0;
var data            = {headers: [], includedCFiles: []};
var filesProcessed = 0;

exports.runTests = function(){
  cleanSync();
  findRequisiteCFiles();
  findTests(function callbackFindTests(base, count){
    buildTests(base, count);
  });
};

function isTestFile(name){
  return (name.indexOf('test') === 0 ? true: false);
}

function isCFile(name){
  return (path.extname(name) === '.c');
}

function getTestFilenames(dirs){
  var testFiles = [];
  testFiles = dirs.filter(function(element, index, array) {
    return ((isCFile(element)) &&
            (isTestFile(element)));
  });
  return testFiles;
}

function basenames(files){
  var testFiles = files.map(function(currentValue){
    return path.basename(currentValue, '.c');
  });
  return testFiles;
}

function unitTestsPath(){
  return cfg.compiler.unit_tests_path;
}

function findTests(callback){
  var dirs       = fs.readdirSync(unitTestsPath());
  var filenames  = getTestFilenames(dirs);
  var bases      = basenames(filenames);
  var foundCount = 0;
  testFileSize = bases.length;
  bar.init(testFileSize);
  bases.map(function(currentValue){
    callback(currentValue, foundCount++);
  });
}

function buildTests(base, count){
  dbg.building(base);
  bar.update('runner');
  mochaAddFile(base);
  buildTestsSync(base);
  runGcc(base, count, function () {
    reporter(base);
  });
};

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
      process.on('exit', function () {
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
        var hBase = removeIncludeMarkers(headers[hCount]);
        if(hBase === cBase){
          data.includedCFiles.push('' + dirs[dirCount] + tempFiles[fileCount]);
        }
      }
    }
  }
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

function runGcc(basename, count, reporter){
  var details = runnerExecDetailsMaybe(count);
  details.push(compilerExec());
  details.push(sourceArgs(basename));
  details.push(compilerExec());
  details.push(runnerArgs(basename));
  details.push(linkerExec());
  details.push(linkerDetails(basename));
  details.push(linkerDestination(basename));
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
//  return details;
}

function runnerArgs(basename){
  return outputR(basename, sourceR(basename, options(includes(defines()))));
  return details;
}

function objectPath(name){
  return (objectFilesPath() + name + objectFilesExtension());
}

function objectDestination(name){
  return (cfg.linker.bin_files.prefix + cfg.linker.bin_files.destination
    + name + cfg.linker.bin_files.extension);
}

function linkerDestination(name){
  return(cfg.linker.bin_files.destination +
         name + cfg.linker.bin_files.extension);
}

function runnerName(){
  return('_Runner');
}

function linkerDetails(basename){
  return ['-lm','-m64',
          objectPath(cfg.runner.name),
          objectPath(basename),
          objectPath(basename + runnerName()),
          objectDestination(basename)];
}

function createRunnerName(sourceName){
  var ext = path.extname(sourceName);
  var runner = sourceName + '_Runner.c';
  return runner;
}

function definesItems(){
  return(cfg.compiler.defines.items);
}

function includesItems(){
  return(cfg.compiler.includes.items);
}

function definesPrefix(){
  return (cfg.compiler.defines.prefix);
}

function includesPrefix(){
  return(cfg.linker.includes.prefix);
}

function defines(){
  return definesItems().map(function(cV){
    return(definesPrefix() + cV);
  });
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

function objectPrefix(){
  return(cfg.compiler.object_files.prefix);
}

function options(args){
  return args.concat(args, compilerOptions()
                     .map(function(cV){return cV;}));
}

function source(basename, args){
  args.push(unitTestsPath() + basename +
            sourceFilesExtension());
  return args;
}

function output(basename, args) {
  args.push(objectPrefix() +
            compilerObjectFilesDest() +
            basename + objectFilesExtension());
  return args;
}

function sourceR(basename, args){
  args.push(compilerBuildPath() +
            basename + '_Runner.c');
  return args;
}

function outputR(basename, args) {
  args.push(objectPrefix() +
            compilerObjectFilesDest() +
            basename + '_Runner.o');
  return args;
}

function runnerExecOutput(args) {
  args.push(objectPrefix() +
            compilerBuildPath() +
            cfg.runner.object);
  return args;
}

function runnerExecSource(args) {
  args.push(cfg.runner.source_path + cfg.runner.sourceName);
  return args;
}

function cleanSync()
{
  clean.clean(compilerBuildPath());
//  rmDir(compilerBuildPath(), false);
}

this.runTests();
