runner     = require('./runner.js');
var mocha  = require('mocha');
var chai   = require('chai');
var assert = chai.assert;
var prjRoot = '/Users/martyn/_unity_quick_setup/';
var unityRoot = '/Users/martyn/_unity_quick_setup/dev/Unity/';

describe('test setup', function() {
  it('should assert 1', function(){
    assert.deepEqual(1,1);
  });
});

describe('test compilation string generation', function() {

  describe('removeIncludeMarkers(count)', function(){
    it('should return string', function(){
      assert.isString(runner.removeIncludeMarkers(''));
    });
    it('should remove \" \" and extension from global header', function(){
      assert.deepEqual('abc', runner.removeIncludeMarkers('"abc.h"'));
    });
    it('should remove < > and extension from global header', function(){
      assert.deepEqual('def', runner.removeIncludeMarkers('<def.h>'));
    });
  });

  describe('runnerExecDetailsMaybe(count)', function(){
    it('should return [] for count > 0', function(){
      assert.deepEqual([], runner.runnerExecDetailsMaybe(1));
      assert.deepEqual([], runner.runnerExecDetailsMaybe(2));
    });
    it('should return runner exec at element 0 given count == 0', function(){
      assert.deepEqual('gcc', runner.runnerExecDetailsMaybe(0)[0]);
    });
    it('should return array  at element 1 given count == 0', function(){
      assert.isArray(runner.runnerExecDetailsMaybe(0)[1]);
    });
  });

  describe('compilerExec', function(){
    it('should return string', function(){
      assert.isString(runner.compilerExec);
    });
    it('should return "gcc"', function(){
      assert.deepEqual('gcc', runner.compilerExec);
    });
  });

  describe('linkerExec', function(){
    it('should return string', function(){
      assert.isString(runner.linkerExec);
    });
    it('should return "gcc"', function(){
      assert.deepEqual('gcc', runner.linkerExec);
    });
  });

  describe('runnerExecArgs()', function(){
    it('should return array', function(){
      assert.isArray(runner.runnerExecArgs());
    });
    it('should return -DUNITY_INCLUDE_DOUBLE element 0 given "abc"', function(){
      assert.deepEqual('-DUNITY_INCLUDE_DOUBLE', runner.runnerExecArgs()[0]);
    });
    it('should return runner source path at element 37', function(){
      assert.deepEqual(unityRoot + 'src/unity.c', runner.runnerExecArgs()[37]);
    });
    it('should return object path at element 38', function(){
      assert.deepEqual('-o' + unityRoot + 'test/build/unity.o', runner.runnerExecArgs()[38]);
    });
  });

  //todo
  ('requisiteCArgs(cFile)', function(){
    it('should return array given "abc"', function(){
      assert.isArray(runner.requisiteCArgs("abc"));
    });
    it('should return -DUNITY_INCLUDE_DOUBLE element 0 given "abc"', function(){
      assert.deepEqual('-DUNITY_INCLUDE_DOUBLE', runner.requisiteCArgs("abc")[0]);
    });
    it('should return source path at element 37', function(){
      assert.deepEqual(unityRoot + 'test/tests/abc.c', runner.requisiteCArgs("abc")[37]);
    });
    it('should return object path at element 38', function(){
      assert.deepEqual('-o' + unityRoot + 'test/build/abc.o', runner.requisiteCArgs("abc")[38]);
    });
  });

  describe('sourceArgs(basename)', function(){
    it('should return array given "abc"', function(){
      assert.isArray(runner.sourceArgs("abc"));
    });
    it('should return -DUNITY_INCLUDE_DOUBLE element 0 given "abc"', function(){
      assert.deepEqual('-DUNITY_INCLUDE_DOUBLE', runner.sourceArgs("abc")[0]);
    });
    it('should return source path at element 37', function(){
      assert.deepEqual(unityRoot + 'test/tests/abc.c', runner.sourceArgs("abc")[37]);
    });
    it('should return object path at element 38', function(){
      assert.deepEqual('-o' + unityRoot + 'test/build/abc.o', runner.sourceArgs("abc")[38]);
    });
  });

  describe('runnerArgs(basename)', function(){
    it('should return array given "abc"', function(){
      assert.isArray(runner.runnerArgs("abc"));
    });
    it('should return -DUNITY_INCLUDE_DOUBLE element 0 given "abc"', function(){
      assert.deepEqual('-DUNITY_INCLUDE_DOUBLE', runner.runnerArgs("abc")[0]);
    });
    it('should return runner source path at element 37', function(){
      assert.deepEqual(unityRoot + 'test/build/abc_Runner.c', runner.runnerArgs("abc")[37]);
    });
    it('should return runner source path at element 38', function(){
      assert.deepEqual('-o' + unityRoot + 'test/build/abc_Runner.o', runner.runnerArgs("abc")[38]);
    });
  });

  describe('objectPath(name)', function(){
    it('should return string given "abc"', function(){
      assert.isString(runner.objectPath("abc"));
    });
    it('should return object path for "abc.o" given "abc"', function(){
      assert.deepEqual(unityRoot + 'test/build/abc.o',runner.objectPath("abc"));
    });
  })

  describe('isTestFile(name)', function(){
    it('should return true for "testSomeFile"', function(){
      assert.isTrue(runner.isTestFile("testSomeFile"));
    });

    it('should return true for "TestSomeFile"', function(){
      assert.isTrue(runner.isTestFile("TestSomeFile"));
    });
    it('should return true for "test_some_file"', function(){
      assert.isTrue(runner.isTestFile("test_some_file"));
    });

    it('should return true for "Test_some_file"', function(){
      assert.isTrue(runner.isTestFile("Test_some_file"));
    });
    it('should return false for "est_some_file"', function(){
      assert.isFalse(runner.isTestFile("est_some_file"));
    });
    it('should return false for "tst_some_file"', function(){
      assert.isFalse(runner.isTestFile("tst_some_file"));
    });
    it('should return false for "Tst_some_file"', function(){
      assert.isFalse(runner.isTestFile("Tst_some_file"));
    });
  });

  describe('isCFile(name)', function(){
    it('should return true for "SomeFile.c"', function(){
      assert.isTrue(runner.isCFile("SomeFile.c"));
    });

    it('should return true for "SomeFile.C"', function(){
      assert.isTrue(runner.isCFile("SomeFile.C"));
    });
    it('should return false for "SomeFile.o"', function(){
      assert.isFalse(runner.isCFile("SomeFile.o"));
    });

    it('should return true for "SomeFile.O"', function(){
      assert.isFalse(runner.isCFile("SomeFile.O"));
    });
    it('should return true for "SomeFile"', function(){
      assert.isFalse(runner.isCFile("SomeFile"));
    });
  });
  describe('getTestFilenames(files)', function(){
    files = [
      'testabc.c'
     ];
    it('should return array', function(){
      assert.isArray(runner.getTestFilenames(files));
    });
    it('should return empty array when passed empty array', function(){
      assert.deepEqual([], runner.getTestFilenames([]));
    });
    it('should return filename if valid testfile name passed in element 0', function(){
      assert.deepEqual('testabc.c', runner.getTestFilenames(['testabc.c'])[0]);
    });
    it('should return filename if "Test_abc.c" passed in element 1', function(){
      assert.deepEqual('Test_abc.c', runner.getTestFilenames(['testabc.c','Test_abc.c'])[1]);
    });
    it('should not return "Test_abc"', function(){
      assert.deepEqual([], runner.getTestFilenames(['Test_abc']));
    });
    it('should not return "Test_abc.o"', function(){
      assert.deepEqual([], runner.getTestFilenames(['Test_abc.o']));
    });
  });

  describe('basenames(files)', function(){
    files = [
      'testabc.c'
     ];
    it('should return array', function(){
      assert.isArray(runner.basenames(files));
    });
    it('should return empty array when passed empty array', function(){
      assert.deepEqual([], runner.basenames([]));
    });
    it('should return basename if "testabc.c" passed in element 0', function(){
      assert.deepEqual('testabc', runner.basenames(['testabc.c'])[0]);
    });
    it('should return basename if "abc.c" passed in element 1', function(){
      assert.deepEqual('testabc', runner.basenames(['testabc.c'])[0]);
      assert.deepEqual('abc', runner.basenames(['testabc.c', 'abc.c'])[1]);
    });
    it('should return "abc" if "abc" passed in', function(){
      assert.deepEqual('abc', runner.basenames(['abc'])[0]);
    });
  });

  describe('unitTestsPath', function(){
    //todo multiple test directories
    it('should return string', function(){
      assert.isString(runner.unitTestsPath);
    });
    it('should return correct path to tests', function(){
      assert.deepEqual(unityRoot + 'test/tests/', runner.unitTestsPath);
    });
  });

//  FIXME doesn't work on travis
//  describe('findTests(callback(base, count))', function(){
//    it('should pass test bases and count to callback', function(){
//      runner.findTests(function(base, count){
//        if(count == 0)
//          assert.deepEqual('test_file1', base);
//        if(count == 1)
//          assert.deepEqual('testunity', base);
//        if(count > 1)
//          throw "should only find two tests";
//      });
//    });
//  });

  //todo
  ('findRequisiteCFiles(callback)', function(){
    it('should pass test bases and count to callback', function(){
      runner.findRequisiteCFiles(function(){
        assert.deepEqual([], runner.data.includedCFiles);
      });
    });
  });

  describe('outputR', function(){
    var args = [];
    it('should build a runner object file and push to array', function(){
      assert.deepEqual(
        ['-o' + unityRoot + 'test/build/somename_Runner.o'],
        runner.outputR('somename', args));
    });
  });

  describe('sourceR', function(){
    var args = [];
    it('should build a runner source file and push to array', function(){
      assert.deepEqual(
        [unityRoot + 'test/build/somename_Runner.c'],
        runner.sourceR('somename', args));
    });
  });

  describe('output', function(){
    var args = [];
    it('should build an object file path and push to array', function(){
      assert.deepEqual(
        ['-o' + unityRoot + 'test/build/somename.o'],
        runner.output('somename', args));
    });
  });

  describe('source', function(){
    var args = [];
    it('should push path to test file to array given basename', function(){
      assert.deepEqual(
        [unityRoot + 'test/tests/somename.c'],
        runner.source('somename', args));
    });
  });

  describe('options', function(){
    ('should return -c as first compiler option', function(){
      assert.deepEqual('-c',runner.options(''));
    });
  });

  describe('definesItems', function(){
    it('should return array', function(){
      assert.isArray(runner.definesItems);
    });
    it('should return array with "UNITY_INCLUDE_DOUBLE" as 1st element', function(){
      assert.deepEqual("UNITY_INCLUDE_DOUBLE",runner.definesItems[0]);
    });
    it('should return array with "UNITY_SUPPORT_TEST_CASES" as 2nd element', function(){
      assert.deepEqual("UNITY_SUPPORT_TEST_CASES",runner.definesItems[1]);
    });
  });

  describe('defines', function(){
    it('should return array', function(){
      assert.isArray(runner.defines([]));
    });
    it('should return array with "-DUNITY_INCLUDE_DOUBLE" as 1st element', function(){
      assert.deepEqual("-DUNITY_INCLUDE_DOUBLE",runner.defines([])[0]);
    });
    it('should return array with "-DUNITY_SUPPORT_TEST_CASES" as 2nd element', function(){
      assert.deepEqual("-DUNITY_SUPPORT_TEST_CASES",runner.defines([])[1]);
    });
  });

  describe('includesItems', function(){
    it('should return array', function(){
      assert.isArray(runner.includesItems);
    });
    it('should return 1st element having path root/src/', function(){
      assert.deepEqual(unityRoot + "src/",runner.includesItems[0]);
    });
    it('should return 2nd element having path root/test/tests/', function(){
      assert.deepEqual(unityRoot + "test/tests/",runner.includesItems[1]);
    });
    it('should return 3rd element having path root/dev/Unity/src/', function(){
      assert.deepEqual(prjRoot + "src/",runner.includesItems[2]);
    });
  });

  describe('includesPrefix', function(){
    it('should return string', function(){
      assert.isString(runner.includesPrefix);
    });
    it('should return includes prefix -I ', function(){
      assert.deepEqual('-I',runner.includesPrefix);
    });
  });

  describe('definesPrefix', function(){
    it('should return string', function(){
      assert.isString(runner.definesPrefix);
    });
    it('should return defines prefix -D ', function(){
      assert.deepEqual('-D',runner.definesPrefix);
    });
  });

  describe('objectPrefix', function(){
    it('should return string', function(){
      assert.isString(runner.objectPrefix);
    });
    it('should return object prefix -o ', function(){
      assert.deepEqual('-o',runner.objectPrefix);
    });
  });

  describe('includes', function(){
    it('should return array', function(){
      assert.isArray(runner.includes([]));
    });
    it('should prefix 1st element with -I', function(){
      assert.deepEqual('-I' + unityRoot + 'src/',runner.includes([])[0]);
    });
    it('should prefix 2nd element with -I', function(){
      assert.deepEqual('-I' + unityRoot + 'test/tests/', runner.includes([])[1]);
    });
  });

  describe('compilerOptions', function(){
    it('should return array', function(){
      assert.isArray(runner.compilerOptions);
    });
    it('should return -c as 1st element', function(){
      assert.deepEqual('-c',runner.compilerOptions[0]);
    });
    it('should return -m64 as 2nd element', function(){
      assert.deepEqual('-m64', runner.compilerOptions[1]);
    });
    it('should return -Wall as 2nd element', function(){
      assert.deepEqual('-Wall', runner.compilerOptions[2]);
    });
  });

  describe('compilerObjectFilesDest', function(){
    it('should return string', function(){
      assert.isString(runner.compilerObjectFilesDest);
    });
    it('should return object files destination directory', function(){
      assert.deepEqual(unityRoot + 'test/build/',runner.compilerObjectFilesDest);
    });
  });

  describe('compilerBuildPath', function(){
    it('should return string', function(){
      assert.isString(runner.compilerBuildPath);
    });
    it('should return build directory', function(){
      assert.deepEqual(unityRoot + 'test/build/',runner.compilerBuildPath);
    });
  });

  describe('sourceFilesExtension', function(){
    it('should return string', function(){
      assert.isString(runner.sourceFilesExtension);
    });
    it('should return source files extension', function(){
      assert.deepEqual('.c',runner.sourceFilesExtension);
    });
  });

  describe('objectFilesExtension', function(){
    it('should return string', function(){
      assert.isString(runner.objectFilesExtension);
    });
    it('should return object files extension', function(){
      assert.deepEqual('.o',runner.objectFilesExtension);
    });
  });

  describe('objectFilesPath', function(){
    it('should return string', function(){
      assert.isString(runner.objectFilesPath);
    });
    it('should return object files path', function(){
      assert.deepEqual(unityRoot + 'test/build/',runner.objectFilesPath);
    });
  });

  describe('objectDestination', function(){
    it('should return string', function(){
      assert.isString(runner.objectDestination('asdf'));
    });
    it('should return path of executable given the basename', function(){
      assert.deepEqual('-o' + unityRoot + 'test/build/asdf.exe',runner.objectDestination('asdf'));
    });
  });

  //todo do we need both this and previous??

  describe('linkerDestination', function(){
    it('should return string', function(){
      assert.isString(runner.linkerDestination('asdf'));
    });
    it('should return path to executable directory', function(){
      assert.deepEqual(unityRoot + 'test/build/asdf.exe',runner.linkerDestination('asdf'));
    });
  });

  describe('runnerExecSource', function(){
    var args = [];
    it('should push unity.c path to array and return array', function(){
      assert.deepEqual(
        [unityRoot + 'src/unity.c'],
        runner.runnerExecSource(args));
    });
  });

  describe('runnerExecOutput', function(){
    it('should push unity.o path to array and return array', function(){
      var args = [];
      assert.isArray(runner.runnerExecOutput(args));
      args = [];
      assert.deepEqual(
        ['-o' + unityRoot + 'test/build/unity.o'],
        runner.runnerExecOutput(args));
    });
  });

  describe('createRunnerName', function(){
    it('should return string', function(){
      assert.isString(runner.createRunnerName('abc'));
    });
    it('should return runner source file name given basename', function(){
      assert.deepEqual('abc_Runner.c',runner.createRunnerName('abc'));
    });
  });

  describe('runnerName', function(){
    it('should return string', function(){
      assert.isString(runner.runnerName);
    });
    it('should return _Runner postfix', function(){
      assert.deepEqual('_Runner',runner.runnerName);
    });
  });

  describe('linkerDetails', function(){
    it('should return array', function(){
      assert.isArray(runner.linkerDetails());
    });
    it('should return "-lm" as 1st element', function(){
      assert.deepEqual('-lm',runner.linkerDetails()[0]);
    });
    it('should return "-m64" as 2nd element', function(){
      assert.deepEqual('-m64',runner.linkerDetails()[1]);
    });
    it('should return path to unity object as 3rd element', function(){
      assert.deepEqual(unityRoot + 'test/build/unity.o',runner.linkerDetails()[2]);
    });
  });

});
