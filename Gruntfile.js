module.exports = function(grunt) {

  var flags = {};
  flags.spawn = false;

  grunt.loadNpmTasks('grunt-simple-mocha');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-shell');

  grunt.initConfig({
    shell: {
      options: {
        execOptions: {
          maxBuffer: Infinity
        },
        stderr: false,
        prettyPrint: true
      },
      target: {
        command: 'node ./runner.js'
//        command: 'mocha generate_parser.js'
      }
    },
    simplemocha:{
      src: "generate_parser.js",
      options:{
        //reporter: 'list',
        //        slow: 500,
        //        timeout: 2000
      }
    },
    watch:{
      all:{
        files: ['Gruntfile.js',
                'report.js',
                'spawner.js',
                'runner.js',
                'gcc.js',
                'progress.js',
                'generate_parser.js',
                'debug.js',
                "/Users/martyn/_unity_quick_setup/dev/Unity/test/tests/test_0.c",
                "/Users/martyn/_unity_quick_setup/dev/Unity/test/tests/test_1.c"
               ],
        tasks: ['shell'],
        options: {
          spawn: flags.spawn
        }
      }
    }
  });
  grunt.registerTask(['simplemocha','shell']);
  grunt.registerTask('default', 'shell');
};
