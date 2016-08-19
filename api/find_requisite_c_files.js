var _ = require('lodash');
var fs = require('fs');

var testRunner = require('./build_test_runner.js');
var path = require('path');
module.exports = function(options){

  this.add({cmd: 'findRequisiteCFiles'},  findRequisiteCFiles);

  function removeIncludeMarkers(header){
    return path.basename('' + header
                         .replace(/"/g, '')
                         .replace(/</g, '')
                         .replace(/>/g, ''), '.h');
  }

  function findRequisiteCFiles(msg, respond){
//    console.log(msg.headers);
    var dirs    = msg.cfg.includesItems,
        cFiles  = [],
        headers = [],
        includedCFiles = [];

    headers = _.uniq(headers.concat.apply([], msg.headers));
//    console.log(headers);
    dirs.map(function(dir){
//    console.log('dir', dir);
      var tempFiles = (fs.readdirSync('' + dir));
//      console.log('tempfiles',tempFiles)
      tempFiles.map(function(temp){
//        console.log('temp', temp);
        var cBase = path.basename(temp, '.c');
//        console.log('cbase',cBase)
        headers.map(function(header){
//          console.log('header', header)
          var hBase = removeIncludeMarkers(header);
//          console.log('hbase',hBase)
          if(hBase === cBase && cBase !== 'unity'){
            includedCFiles.push('' + dir + temp);
          }
        });
      });
    });
//    console.log('includedCFiles',includedCFiles);
    respond(null, {includedCFiles: includedCFiles});
  }
};
