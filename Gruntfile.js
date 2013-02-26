module.exports = function(grunt) {

  'use strict';

  grunt.initConfig({
      pkg:      grunt.file.readJSON('package.json')
    , docco:    {
        all: {
            options: {
              output: 'docs'
            }
          , src:     ['lib/**/*.js']
        }
      }
    , jshint:   {
          all:     [
              'Gruntfile.js'
            , 'bin/**/*'
            , 'lib/**/*.js'
          ]
        , options: {
            jshintrc: '.jshintrc'
          }
      }
    , watch:    {
          files: ['<%= jshint.all %>']
        , tasks: ['default']
      }
  });

  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.loadNpmTasks('grunt-docco');

  grunt.registerTask('build',   ['docco']);
  grunt.registerTask('default', ['test', 'build']);
  grunt.registerTask('test',    ['jshint']);

};
