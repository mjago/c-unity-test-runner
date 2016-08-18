const readline = require('readline');
const fs = require('fs');
var clean = require('./clean.js');
var cfg = require("./gcc.js");

module.exports = function(options){

  this.add({cmd: 'prepare'}, prepare);
  this.prepare_count = 0;

  var failTimeout;
  var count = 0;

  function cleanSync()
  {
    clean.clean(cfg.compilerBuildPath);
  }

  function prepare(msg, respond) {
    cleanSync();
    console.log('preparing...');

    failTimeout = setTimeout(function(test_count){
      console.log('Failed! *********************');
      respond('FAILED', {success: 'FAIL', pass: 0, fail: msg.id, id: msg.id});
    }, 5000, this.test_count);

    var lineReader = require('readline').createInterface({
      input: require('fs').createReadStream('./config')
    });

    lineReader.on('line', parseLine);
    lineReader.on('close', configClosed);

    function parseLine(line){
      count += 1;
      respond(null, {success: 'Config Read OK',
                     id: count,
                     filename: line});
    }

    function configClosed(){
      console.log('Config parsed and prepared');
      clearTimeout(failTimeout);
    };
  }
};
