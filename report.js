var fs          = require('fs');
var util        = require('util');
var Mocha       = require('mocha');
var path        = require('path');
var peg         = require('./peg.js');
var cfg         = require('./gcc.js').data();
var dbg         = require('./debug.js');
var prg         = require('./progress.js');
var TestDetails = require('./test_detail.js');
var outBuf      = '';

exports.run = function(basename){
  var test = new TestDetails(basename);
  var f = fs.readFileSync(cfg.compiler.build_path + basename + '.txt');
  var ary = (f + '').split('\n');
  prg.tick();

  if(basename !== ''){
    startSuite(test);
  }

  for(count = 0; count < ary.length; count++){
    test.reset();
    test.results[count] = peg.parse('' + ary[count], 'rptParser');

    //console.log(test.testResults[count]);

    if( ! test.results[count]){
      if(beginsWithTest(ary[count])){
        writeParseFailed(basename, ary[count]);
        test.fileBasename = basename;
      }
    }

    else if ((typeof test.results[count] !== 'undefined')
             && test.results[count]
             && util.isArray(test.results[count])){
      if (test.results[count][0][0][0][0] == 'test' ||
          test.results[count][0][0][0][0] == 'Test') {
        if(test.results[count][0][4]){
          parseLong(test, count);
        }
        else
        {
          parseFail(test, count);
        }
      }
      else if (test.results[count][0][0][0] == 'test' ||
               test.results[count][0][0][0] == 'Test'){
        parseShort(test, count);
      }
      else
      {
        writeParseFailed(basename, ary[count]);
      }
      writeTest(test);
    }
  }

  endSuite();
  fs.writeFileSync(cfg.compiler.build_path + basename + '.js', outBuf);
  outBuf = '';
};

function beginsWithTest(str){
  return_val = false;
  if(((str + '').substring(0,3) === 'test') ||
     ((str + '').substring(0,3) === 'test') ){
    return_val = true;
    return return_val;
  }
}

function parseFail(test, count){
  console.log('parseFail');

  var results = test.results[count];
  test.fileName = results[0][0][0][0]
    + results[0][0][1].join('')
    + results[0][1].join('');
  console.log('\nfileName', test.fileName);

  test.lineNum = results[0][3][0] +
    results[0][3][1].join('');
  //console.log('lineNum', test.lineNum);

  test.testName = results[0][5] +
    results[0][6].join('');
  console.log('testName', test.testName);

  test.testResult = results[0][8];
  //console.log('test.testResult', test.testResult);

  if(results[4]){
    test.expected = results[4].join('');
    //console.log('Expected', test.expected);
    test.actual = results[6].join('');
    //console.log('Was', test.actual);
    test.message = '';
    for(var x = 0; x < results[2].length; x++){
      test.hint += results[2][x][1];
    }
    //console.log('Test.Hint', test.hint);

  }
  else{
    test.message = results[2].join('');
    //console.log('test.message', test.message);
  }
}

function parseShort(test, count){
  console.log('parseShort');
  var results = test.results[count]
  //console.log('parseShort');
  test.fileName = results[0][0][0] +
    results[0][1].join('') +
    results[1].join('');
  console.log('fileName', test.fileName);

  test.lineNum = results[3][0] +
    results[3][1].join('');
  //console.log('lineNum', test.lineNum);

  test.testName = results[5] +
    results[6].join('');
  console.log('testName', test.testName);

  test.testResult = results[8];
  //console.log('test.testResult', test.testResult);
}

function parseLong(test, count){
  console.log('parseLong');
  //console.log('count', count);
  var results = test.results[count];
  test.fileName = results[0][0][0][0] +
    results[0][0][1].join('') +
    results[0][1].join('');
  console.log('fileName', test.fileName);

  test.lineNum = results[0][3][0] +
    results[0][3][1].join('');
  //console.log('lineNum', test.lineNum);

  test.testName = results[0][5] +
    results[0][6].join('');
  console.log('testName', test.testName);

  if(results[4]){ // normal fail
    console.log('Normal Fail?');
    test.actualResult = results[0][8];
    console.log('test.actualResult', test.actualResult);
    test.testResult = results[0][8];
    console.log('test.testResult', test.testResult);
    test.expected = results[4].join('');
    console.log('Expected', test.expected);

    for(var x = 0; x < results[2].length; x++){
      test.hint += results[2][x][1];
    }

    console.log('Hint', test.hint);

    test.actual = results[6].join('').replace(/,/g, '');
    console.log('Was', test.actual);
    if(results[7] === '. '){
      var std_msg = test.hint = results[2].join('').replace(/,/g, '');
      var custom_msg = results[8].join('');
      test.hint = '';
      if(std_msg !== ''){
        test.hint += std_msg + ', ';
      }
      test.hint += custom_msg;
      test.message = '';
    }
  }
  else{
    var result;
    console.log('Not Normal Fail?');
    result = results[2].join('');
    console.log('result', result);
    var actualResult = result.slice(-4);
    console.log('actualResult', actualResult);
    if((actualResult == 'PASS') || (actualResult === 'FAIL')) {
      test.testResult = actualResult;
    }
    else{
      test.testResult = 'FAIL';
      test.message = results[2].join('');
    }
//    test.testResult = test.actualResult;
//    console.log('test.testResult', test.testResult);
//    console.log('Expected', test.expected);
//    console.log('Was', test.actual);
//    test.message = results[2].join('');
//    console.log('here!')
//    test.testResult = results[0][8];
//    console.log('test.testResult',test.testResult)
  }
}


function errMessageStart(){
  return 'err.message = "Test Error: ';
}

function startSuite(test){
  outBuf += ('suite("' + test.fileName + '.c", f);\n');
  outBuf += ('function f(){\n');
}

function writeParseFailed(name, parseString){
  outBuf += ('test("Test runner failed to parse", function(){\n');
  outBuf += ('var err = new Error("Test Runner Parsing Failure");\n' );
  outBuf += (errMessageStart() + parseString + ' ";' );
  outBuf += ('err.stack = "";\n');
  outBuf += ('throw err;\n})\n');
}

function writePass(test){
  outBuf += ('test("' + test.testName + '", function(){');
  outBuf += '});\n';
}

function writeFailException(test){
  outBuf += ('var err = new Error;\n' );
  if(test.message)
  {
    outBuf += (errMessageStart() + test.message + '";\n');
  }
  else{
    if(test.expected){
      if(test.hint !== ''){
        test.hint += ',';
      }
      outBuf += ('err.expected = "' + test.expected + '";\n' );
      outBuf += ('err.actual = "' + test.actual + '";\n' );
      outBuf += (errMessageStart() + test.hint + ' expected: ' + test.expected );
      outBuf += (', was: ' + test.actual + '";\n' );
    }
  }
  var temp = (test.fileName + '').replace('_Runner', '');
  outBuf += ('err.stack = " Line '
             + test.lineNum
             + ', '
             + (test.fileName + '').replace('_Runner', '')
             + '";\n');
  outBuf += ('throw err;\n});\n' );

}

function writeFail(test){
  outBuf += ('test("' + test.testName + '", function(){\n');
  writeFailException(test);
}


function writeIgnore(test){
  outBuf+= ('test.skip("' + test.testName + '", function(){});\n');
}

function writeTest(test){

  if(test.testResult === 'PASS'){
    writePass(test);
  }

  else if(test.testResult === 'FAIL'){
    writeFail(test);
  }

  else if(test.testResult == 'IGNORE'){
    writeIgnore(test);
  }

}

function endSuite(){
    outBuf += ('};\n');
}
