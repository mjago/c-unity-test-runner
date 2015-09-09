var testRunner      = require('./buildTestRunner.js'),
    readStreamName  = "/Users/martyn/_unity_quick_setup/dev/Unity/test/tests/testunity.c",
    runnerName      = "/Users/martyn/_unity_quick_setup/dev/Unity/test/build/testunityRunner2.c";

testRunner.build(readStreamName, runnerName);
