const readline = require('readline');
const fs = require('fs');
var clean = require('./clean.js');
var cfg = require("./gcc.js");

module.exports = function(options){

  this.add({cmd: 'collect'}, collect);

  var failTimeout;
  var count = 0;

  function collect(msg, respond) {
    var details = [];
    var basename = 'unity';
    var reporter = null;
    console.log('collecting arguments...');
    details.push(cfg.compilerExec);
    details.push(runnerExecArgs());
//    console.log(details);
    respond(null, {args: details,
                   basename: basename});
  }

  function runnerExecOutput(args) {
    args.push(cfg.objectPrefix +
              cfg.compilerBuildPath +
              cfg.runner.object);
    return args;
  }

  function runnerExecSource(args) {
    args.push(cfg.runner.source_path + cfg.runner.sourceName);
    return args;
  }

  function runnerExecArgs(){
    return runnerExecOutput(runnerExecSource(options(includes(defines()))));
  }

  function options(args){
    return args.concat(args, cfg.compilerOptions
                       .map(function(cV){return cV;}));
  }

  function includes(args){
    return args.concat(args, cfg.includesItems
                       .map(function(cV){
                         return(cfg.includesPrefix + cV);
                       }));
  }

  function defines(){
    return cfg.definesItems.map(function(cV){
      return(cfg.definesPrefix + cV);
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
    console.log(details);
    spawnRunner(details, basename, function(){});
    //  return awaitFileExistance(cfg.compilerBuildPath + cfg.runner.object + '');
  }

  function setGuard() {
    failTimeout = setTimeout(function(test_count){
      console.log('Failed! *********************');
      respond('FAILED', {success: 'FAIL', pass: 0, fail: msg.id, id: msg.id});
    }, 5000, this.test_count);
  }

  function clearGuard() {
    clearTimeout(failTimeout);
  };
};
