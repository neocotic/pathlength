module.exports = function(grunt) {

  'use strict';

  grunt.initConfig({
      pkg:      grunt.file.readJSON('package.json')
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

  grunt.registerTask('default', ['test']);
  grunt.registerTask('test',    ['jshint']);

};
