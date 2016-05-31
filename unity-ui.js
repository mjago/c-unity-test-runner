var Mocha = require('mocha'),
    Suite = require('mocha/lib/suite'),
    Test  = require('mocha/lib/test');

require('shelljs/global');

module.exports = Mocha.interfaces['unity-ui'] = function(suite) {
  var suites = [suite];

  suite.on('pre-require', function(context, file, mocha) {

    context.pending = function(title) {
      var suite, pending;

      suite = suites[0];
      pending = new Test(title, null);

      pending.pending = true;
      pending.isPending = true;
      pending.file = file;
      suite.addTest(pending);

      return pending;
    };

    /**
     * Describe a "suite" with the given `title` and callback `fn` containing
     * nested suites and/or tests.
     */

    context.suite = function(title, fn) {
      var suite = Suite.create(suites[0], title);
      fn.call(suite);
      return suite;
    };

    var executeRunner = function() {
      if (exec('node index.js').code !== 0) {
        // echo('done');
        // exit(1);
        
        var err = new Error;
        err.message = "message";
        err.stack = "Line 123, 1 2 4 4 5 etc\n 45678\n  9 10 11 12\n   13 14 15 16";
        err.actual   = "1 2 4 4 5";
        err.expected = "1 2 3 4 5";
        //                        err.lineNum = 456;
        //                        err.fileName = 'Filename';
        //                        err.operator = 'deepEqual';
        err.showDiff = true;
        throw err;
      }
    };


    var test;
    for(var count = 0; count < 2; count++){
      test = new Test('this is test ' + (count + 1) +
                      ' ~ this is test ' + (count + 1),
                      executeRunner());

      suite.addTest(test);
    }

    //    pending("PENDING: " + "Here's the addition we made to the UI");
    //    for(count = 2; count < 10000; count++){
    //      test = new Test('this is test ' + (count + 1) + ' ~ this is test ' + (count + 1), function() { } );
    // pending("PENDING: " + "Here's the addition we made to the UI");
    //      suite.addTest(test);
    //    }
  });
};

// mocha --inline-diffs --require ./udd-ui.js --ui udd-ui test.js

