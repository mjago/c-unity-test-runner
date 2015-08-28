var fs        = require('fs');
var PEG       = require('pegjs');
var chai      = require('chai');
var assert    = chai.assert;
var clc       = require('cli-color');
var util      = require('util');
var showExc   = false;
var nl        = '\n';
var fs = require('fs'),
    readline = require('readline'),
    stream = require('stream'),
    count = 1,
    lineNum = 1;

function buildParser(string){
  return PEG.buildParser(string);
}

function parse(parser, x){
  try {
    return parser.parse(x);
  }
  catch(err) {
    if (showExc)
      console.log(clc.magentaBright(err));
    return false;
  }
}

//var test_params = 'test_params = "(" [" "\t]* "void" [" "\t]* ")"';
var test_some_ws = 'test_some_ws = [" "\t]+ '
var test_all_ws = 'test_all_ws = [" "\t]* ';
var test_void = 'test_void = "void" ';
var testname_prefix = 'testname_prefix = "test" "_"? ';
var test_name = 'test_name = testname_prefix [a-zA-Z_0-9]+' + nl + testname_prefix;
var test_body = "test_body = '{' test_body '}' / ('{'.*'}') ";
var test_params = 'test_params = "(" test_params ")" / "(" test_all_ws ("void" / ("int" test_some_ws [a-zA-Z_0-9]+ ) / "") test_all_ws ")" ' + nl + test_all_ws + nl + test_some_ws;
var test_function =
      'test_function = test_all_ws test_void test_some_ws test_name test_all_ws test_params test_all_ws test_body' +
      test_all_ws +
      test_void    +
      test_some_ws +
      testname_prefix +
      test_name    +
      test_all_ws  +
      test_params  +
      test_all_ws  +
      test_body;

var p = buildParser(test_function);
var outstream = fs.createWriteStream('./output');
for(var a = 0; a < 500; a++)
{
  var instream = fs.createReadStream("/Users/martyn/_unity_quick_setup/dev/Unity/test/tests/testunity.c",
                                     {encoding: 'utf8'});
  var rl = readline.createInterface({
    input: instream,
    output: outstream,
    terminal: false
  });
  outstream.readable = false;
  outstream.writable = true;
//  var outstream = new stream;

  rl.on('line', function(line) {
    if(line.indexOf('void') > -1){
      var tests = (parse(p, line));
      if(tests){
        var str = (tests[1] + ' ' + tests[3][0][0] +  tests[3][1].join('') + '(' + tests[5][2] + ')' + nl);
        if(str === undefined)
          console.log('*************************************')
//        if(count % 1 === 0 ){
//      if(count % 10000 === 0 ){
//          console.log(count, lineNum, str);
//        }
        count += 1;

        outstream.write(count + ' ' + lineNum + ' ' + str);
//        outstream.write(str);
//        rl.write(tests[1] + ' ' + tests[3][0][0] +  tests[3][1].join('') + '(' + tests[5][2] + ')' + nl);
//        console.log( tests[5][2]);
//    }
//      describe('Test Function Parameter Parsing: ', function() {
//        it('should parse ()', function() {
//          //          assert.deepEqual(['(', [], '', [], ')'],parse(p,'()'));
//        });
//    }});

    //Do your stuff ...
    //Then write to outstream
//    rl.write(cubestuff);
      }}
    lineNum += 1;
  });
}

// var fs = require('fs')
// , util = require('util')
// , stream = require('stream')
// , es = require("event-stream");
//
// var lineNr = 1;
// s = fs.createReadStream("/Users/martyn/_unity_quick_setup/dev/Unity/test/tests/testunity.c", {encoding: 'utf8'})
// //s = fs.createReadStream('very-large-file.csv')
//   .pipe(es.split())
//   .pipe(es.mapSync(function(line){
//
//     // pause the readstream
//     s.pause();
//
//     lineNr += 1;
//     console.log("line = " + lineNr);
//     (function(){
//       console.log("es = " + es);
//       // process line here and call s.resume() when rdy
// //      logMemoryUsage(lineNr);
//
//       // resume the readstream
//       s.resume();
//
//     })();
//   }).on('error', function(){
//     console.log('Error while reading file.');
//   }).on('end', function(){
//     console.log('Have read entire file.')
//   })
//        );
//
// // var fs = require('fs');
// // var stream = fs.createReadStream("/Users/martyn/_unity_quick_setup/dev/Unity/test/tests/testunity.c", {encoding: 'utf8'});
// //
// // function read() {
// //   var buf;
// //   var count = 1;
// //   while (buf = stream.readLine()) {
// //     if(buf.length >= 1) {
// //       //    if(buf.substr('void'))
// //       console.log(count);
// //       count += 1;
// //     }
// //   }
// // }
// //
// // stream.on('readable', read);
// //
// // stream.once('end', function() {
// //   console.log('stream ended');
// // });
