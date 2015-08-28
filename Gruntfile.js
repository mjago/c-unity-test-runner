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
      src:"stream.js",
      options:{
        reporter: 'spec',
//        slow: 200,
//        timeout: 2000
        }
    },
    watch:{
      all:{
        files: ['Gruntfile.js',
                'stream.js',
                'test_stream.js'
               ],
        tasks: ['shell'],
        options: {
//          spawn: false
        }
      }
    }
  });
  grunt.registerTask(['build', 'shell', 'simplemocha']);
  grunt.registerTask('default', 'simplemocha');
};
