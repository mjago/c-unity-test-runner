var clc       = require('cli-color');
var fs        = require('fs');
var semRpt    = require('semaphore')(1);
var util      = require('util');
var Mocha     = require('mocha');
var path      = require('path');
var peg       = require('./peg.js');
var cfg       = require('./gcc.js').data();
var dbg       = require('./debug.js');
var fileName = '';
var lineNum;
var testName;
var actualResult;
var testResult;
//var results = {};
var outBuf = '';
var start = false;

// First, you need to instantiate a Mocha instance.

var mocha = new Mocha({
  ui: 'tdd',
  reporter: 'list'
});

exports.run = function (stream, name){

  semRpt.take(function() {

    run(stream, name);

    semRpt.leave();

  });
};

function parseShort(testResults, count){
  if ( typeof testResults[0] !== 'undefined' && testResults[0]){

    fileName = testResults[0][0][0] +
      testResults[0][1].join('') +
      testResults[1].join('');

    //console.log('fileName', fileName)

    lineNum = testResults[3][0] +
      testResults[3][1].join('');
    //console.log('lineNum', lineNum)

    testName = testResults[5] +
      testResults[6].join('');
    //console.log('testName', testName)

    testResult = testResults[8];
    //console.log('testResult', testResult)

//    if( ! results[fileName])
//      results[fileName] = {};
//    results[fileName][testName] = {
//      lineNum: lineNum,
//      testResult: testResult
//    };

//    endSuite();
//    fs.writeFileSync(cfg.compiler.build_path + name + '.js', outBuf);
//    outBuf = '';
//
//    // Here is an example:
//    fs.readdirSync(cfg.compiler.build_path).filter(function(file){
//      // Only keep the .js files
//      return file.substr(-3) === '.js';
//
//    }).forEach(function(file){
//      // Use the method "addFile" to add the file to mocha
//      mocha.addFile(
//        path.join(cfg.compiler.build_path, file)
//      );
//    });

  }
}

function parseLong(testResults){
  if ( typeof testResults[0] !== 'undefined' && testResults[0]){

    fileName = testResults[0][0][0][0] +
      testResults[0][0][1].join('') +
      testResults[0][1].join('');
    //console.log('fileName', fileName)

    lineNum = testResults[0][3][0] +
      testResults[0][3][1].join('');
    //console.log('lineNum', lineNum)

    testName = testResults[0][5] +
      testResults[0][6].join('');
    //console.log('testName', testName)

    actualResult = testResults[0][8];
    //console.log('actualResult', actualResult)

    testResult = testResults[2][8];
    //console.log('testResult', testResult)

//    if( ! results[fileName])
//      results[fileName] = {};
//    results[fileName][testName] = {
//      lineNum: lineNum,
//      testResult: testResult
//    };
//    endSuite();
//    fs.writeFileSync(cfg.compiler.build_path + name + '.js', outBuf);

//    // Here is an example:
//    fs.readdirSync(cfg.compiler.build_path).filter(function(file){
//      // Only keep the .js files
//      return file.substr(-3) === '.js';
//
//    }).forEach(function(file){
//      // Use the method "addFile" to add the file to mocha
//      mocha.addFile(
//        path.join(cfg.compiler.build_path, file)
//      );
//    });
  }
}

run = function(stream, name){

  var f = fs.readFileSync(cfg.compiler.build_path + name + '.txt');
  var ary = (f + '').split('\n');

  var testResults = [];
  for(count = 0; count < ary.length; count++){
    testResults[count] = peg.parse('' + ary[count], 'rptParser');
    if ( typeof testResults[count] !== 'undefined' && testResults[count]){
      if(util.isArray(testResults)){
//        console.log(testResults[count][0][0][0]);
        if (testResults[count][0][0][0][0] == 'test' || testResults[count][0][0][0][0] == 'Test'){
          //console.log(' Long  ****************************************');
          parseLong(testResults[count], count);
        }
        else if (testResults[count][0][0][0] == 'test' || testResults[count][0][0][0] == 'Test'){
          //console.log(" Short  *****************************************");
          parseShort(testResults[count], count);
        }
        if(( ! start) && fileName != ''){
          startSuite(fileName);
          start = true;
        }
        else
        {
          //console.log('start ***********************************************************************')
        }
        writeTest(testResult, lineNum, fileName, testName);
      }
    }
  }

  endSuite();
  fs.writeFileSync(cfg.compiler.build_path + name + '.js', outBuf);
  outBuf = '';
  fs.readdirSync(cfg.compiler.build_path).filter(function(file){
    return file.substr(-3) === '.js';
  }).forEach(function(file){
    mocha.addFile(
      path.join(cfg.compiler.build_path, file)
    );
  });

  mocha.run(function(failures){
    process.on('exit', function () {
      process.exit(failures);
    });
  });
};

//mocha.addFile('/Users/martyn/node/ui/test/' + name + '.js');

// Now, you can run the tests.

//if(dbg.flags.log_timers){
//  console.timeEnd(name);
//};

function startSuite(fileName){
  //console.log('suite("' + fileName + '", myFunction);');
  //console.log();
  //console.log('function myFunction() {');
  //console.log();

  outBuf += ('suite("' + fileName + '", myFunction);\n');
  outBuf += ('\n');
  outBuf += ('function myFunction() {\n');
  outBuf += ('\n');
}

function writeTest(result, line, testFile, testName){
  if(result === 'PASS'){
    outBuf+= ('  test("' + testName + '", function() {\n');
  }
  else if(result == 'FAIL'){
    //console.log('    throw new Error(Error ' + lineNum + ')' );
    outBuf += ('    var err = new Error;\n' );
    outBuf += ('    err.expected = "0xffff";\n' );
    outBuf += ('    err.actual = "0xfffe";\n' );
    outBuf += ('    err.message = "  Failed to Fail in Teardown!";\n' );
    outBuf += ('    err.stack = "at Line: ' + line + ' of ' + testFile + '";\n' );

    outBuf += ('    throw err;\n' );
  }
  else if(result == 'IGNORE')
    outBuf+= ('  test.skip("' + testName + '", function() {\n');
  //console.log('  });');
  //console.log();
  outBuf += ('  });\n');
  outBuf += ('\n');
}

function endSuite(){
  //console.log('});');
  //console.log();
  outBuf += ('};\n');
  outBuf += ('\n');
}
