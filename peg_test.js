var clc      = require('cli-color');
var fs       = require('fs');
var readline = require('readline');
var peg      = require('./peg.js');
var cfg      = require('./gcc.js').data();
var testCount = 0;
var rd;
var semRpt   = require('semaphore')(1);
var cfg      = require('./gcc.js').data();

run = function(name){
  f = fs.readFileSync(cfg.compiler.build_path + name + '.txt');
  console.log('f',f);
  var ary = (f + '').split('\n');
//  console.log(ary);
  results = [];
  for(count = 0; count < ary.length; count++){
    results[count] = peg.parse('' + ary[count], 'rptParser');
    console.log('count:', count);
    console.log('results', results[count][1]);
  }
}
run('testunity');

console.log('finished');
