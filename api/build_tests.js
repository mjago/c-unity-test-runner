var testRunner = require('./build_test_runner.js');
var path = require('path');
module.exports = function(options){

  this.add({cmd: 'buildTests'},   buildTests);

  function buildTests(msg, respond) {
//    console.log('basenames', msg.basenames);
    var headers = buildTestsSync(msg);
//    console.log('headers',headers);
    respond(null, {headers: headers});
  }

  function buildTestsSync(msg){
    var totalHeaders = [];
    for(var count = 0; count < msg.basenames.length; count++){
      //      console.log(msg.basenames[count]);
      var checkLength = function() {
        if(count === msg.basenames.length - 1) {
          return;
        }
      };

//      console.log(msg.cfg.unitTestsPath +
//                  basename +
//                  '.c',
//                  msg.cfg.compilerBuildPath +
//                  createRunnerName(basename));

      var basename = msg.basenames[count];
      var headers = testRunner
            .build(msg.cfg.unitTestsPath +
                   basename +
                   '.c',
                   msg.cfg.compilerBuildPath +
                   createRunnerName(basename),
                   checkLength);
      totalHeaders = totalHeaders.concat(headers);
    }
    return totalHeaders;
  }

  function createRunnerName(sourceName){
    var ext = path.extname(sourceName);
    var runner = sourceName + '_Runner.c';
//    console.log(runner);
    return runner;
  }
};
