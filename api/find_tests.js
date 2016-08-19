var fs = require('fs');
var path = require('path');

module.exports = function(options){

  this.add({cmd: 'findTests'},   findTests);

  function isTestFile(name){
    return (name.indexOf('test') === 0) ||
      (name.indexOf('Test') === 0);
  }

  function isCFile(name){
    return (path.extname(name) === '.c') || (path.extname(name) === '.C');
  }

  function basenames(files){
    var testFiles =files.map(function(currentValue){
      return path.basename(currentValue, '.c');
    });
    return testFiles;
  }

  function getTestFilenames(files){
    var testFiles = [];
    testFiles = files.filter(function(element, index, array) {
      return ((isCFile(element)) &&
              (isTestFile(element)));
    });
    return testFiles;
  }

  function findTests(msg,respond){
    var files = fs.readdir(msg.cfg.unitTestsPath, function(err, files){
      if(err){
        console.log('rejected');
        return ("Error: Can't find tests:", err);
      }
      else{
        var filenames = getTestFilenames(files);
        respond(null, {filenames: filenames,
                       basenames: basenames(filenames)});
      }
    });
  }
};

