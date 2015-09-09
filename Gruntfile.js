module.exports = function(grunt) {

  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-shell');

  grunt.initConfig({
    shell: {
      options: {
        stderr: false
      },
      target: {
        command: 'node stream.js'
      }
    },
    simplemocha:{
      src: "test_search_includes.js",
      options:{
        reporter: 'spec',
//        slow: 500,
        timeout: 2000
      }
    },
    watch:{
      all:{
        files: ['Gruntfile.js',
  //              'buildTestRunner.js',
                'test_search_includes.js',
                'gcc.js',
//                'generate_parser.js',
    //            'debug.js',
      //          'peg.js',
        //        'stream.js',
          //      'test_includesParser.js',
            //    "/Users/martyn/_unity_quick_setup/dev/Unity/test/tests/testunity.c"
               ],
        tasks: ['simplemocha'],
        options: {
//          spawn: false
        }
      }
    }
  });
  grunt.registerTask(['simplemocha','shell']);
  grunt.registerTask('default', 'shell');
};

