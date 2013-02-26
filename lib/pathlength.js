// [pathlength](http://neocotic.com/pathlength) 0.1.0  
// Copyright (c) 2013 Alasdair Mercer  
// Freely distributable under the MIT license.  
// For all details and documentation:  
// <http://neocotic.com/pathlength>

'use strict';

// Module dependencies
// -------------------

var EventEmitter = require('events').EventEmitter
  , _            = require('underscore')
  , async        = require('async')
  , fs           = require('fs')
  , path         = require('path')
  , util         = require('util');

// Private constants
// -----------------

    // Regular expression used to split up the filter input.
var R_FILTER   = /(\*|[!=]=?|[><]=?|eq|ne|[gl]te?)\s*([\*@]|\d*)/i
    // Regular expression used to check for valid filter operands.
  , R_OPERAND  = /[\*@]|\d*/
    // Regular expression used to check for valid filter operators.
  , R_OPERATOR = /\*|[!=]=?|[><]=?|eq|ne|[gl]te?/i;

// Private functions
// -----------------

// Determine whether the given `path` passes the `filter` provided.
function checkFilter(filter, path) {
  var len      = path.length
    , operator = filter[0]
    , operand  = parseInt(filter[1], 10);
  if (operator !== '*' && !_.isNaN(operand)) {
    switch (operator) {
      // Not equal
      case '!':
      case '!=':
      case 'ne':
        return len !== operand;
      // Equal
      case '=':
      case '==':
      case 'eq':
        return len === operand;
      // Greater than
      case '>':
      case 'gt':
        return len > operand;
      // Greater than or equal to
      case '>=':
      case 'gte':
        return len >= operand;
      // Less than
      case '<':
      case 'lt':
        return len < operand;
      // Less than or equal to
      case '<=':
      case 'lte':
        return len <= operand;
    }
  }
  return true;
}

// Attempt to create a filter array from the given `value`.  
// If either the operator or operand cannot be derived, a wildcard character will replace them in
// the returned filter array.  
// `@` can be used as the operand to represent the length of the target file/directory.  
// Examples:
//     // [">=", "20"]
//     return createFilter(">=20");
// 
//     // ["*", "*"]
//     return createFilter("foo");
function createFilter(value) {
  // Attempt to parse `value` if it's a string.
  if (_.isString(value)) {
    value = value.match(R_FILTER);
    return createFilter(value && value.slice(1));
  }
  var filter = ['*', '*'];
  // Only replace wildcard characters if valid alternatives can be derived.
  if (_.isArray(value)) {
    if (R_OPERATOR.test(value[0])) {
      filter[0] = value[0];
    }
    if (R_OPERAND.test(value[1])) {
      filter[1] = value[1];
    }
  }
  return filter;
}

// Replace special filter characters with thier corresponding values.
function specialFilter(filter, data) {
  if ('@' === filter[1]) {
    filter[1] = String(data.target.length);
  }
}

// Check the path of the given `file` against the filter.  
// If recursive mode is enabled, continue to traverse the file system and check its children.
function traverse(engine, dataSet, options, base, file, callback) {
  async.waterfall(
      [
          function (_callback) {
            // Fetch the file statistics.
            fs.stat(file, _callback);
          }
        , function (stats, _callback) {
            // Validate path against the filter array and create data object.
            var passed = checkFilter(options.filter, file)
              , data   = {
                    path:      file
                  , length:    file.length
                  , directory: stats.isDirectory()
                };
            // Trigger events in the correct order while storing the data.
            if (passed) {
              if (dataSet.length) {
                engine.emit('betweenData');
              } else {
                engine.emit('afterStart');
              }
              engine.emit('beforeData', data);
              dataSet.push(data);
              engine.emit('data',       data);
              engine.emit('afterData',  data);
            }
            // Check if the directory's children should be checked.
            if ((passed || !options.stop) && data.directory && options.recursive) {
              fs.readdir(file, _callback);
            } else {
              _callback(null, []);
            }
          }
        , function (files, _callback) {
            if (files.length) {
              // Check all of the children `files`.
              async.parallel(
                  files.map(function (name) {
                    return function (__callback) {
                      traverse(engine, dataSet, options, base, path.join(file, name), __callback);
                    };
                  })
                , function (err, results) {
                    _callback(err, results);
                  }
              );
            } else {
              _callback(null);
            }
          }
      ]
    , function (err) {
        callback(err, dataSet);
      }
  );
}

// Engine
// ------

// Create a new instance of `Engine`.
function Engine() {
  this.debug = false;
}

// Extend `EventEmitter` for event management functionality.
util.inherits(Engine, EventEmitter);

// Filter the target file/directory and/or all children using the `options` provided.
Engine.prototype.find = function(options, callback) {
  var that = this;
  // Handle the optional arguments.
  if (_.isFunction(options)) {
    callback = options;
    options  = {};
  }
  // Handle the default options.
  options = options || {};
  _.defaults(options, {
      filter:    createFilter()
    , recursive: false
    , stop:      false
    , target:    process.cwd()
  });
  // Create a valid filter.
  options.filter = createFilter(options.filter);
  if (this.debug) {
    console.log('callback: %j',  !!callback);
    console.log('context: %j',   _.has(options, 'context'));
    console.log('filter: %j',    options.filter);
    console.log('recursive: %j', options.recursive);
    console.log('stop: %j',      options.stop);
    console.log('target: %s\n',  options.target);
  }
  // Let's get this show started!
  this.emit('start');
  async.waterfall(
      [
          function (_callback) {
            // Derive the actual path for the target file/directory.
            fs.realpath(options.target, _callback);
          }
        , function (path, _callback) {
            // Replace the special filter characters.
            specialFilter(options.filter, { target: path });
            // Check that the `path` passes the filter and the directory contents where
            // appropriate.
            traverse(that, [], options, path, path, _callback);
          }
      ]
    , function (err, dataSet) {
        if (err) {
          if (_.isFunction(callback)) {
            callback.call(options.context, err);
          } else {
            that.emit('error', err);
          }
        }
        // Sort the `dataSet` alphabetically as the order may have been distorted during the
        // asynchronous processing.
        dataSet.sort(function (curr, next) {
          return curr.path.localeCompare(next.path);
        });
        // Finalize the process.
        that.emit('beforeEnd', dataSet);
        async.parallel([
            function () {
              that.emit('end', dataSet);
            }
          , function () {
              if (_.isFunction(callback)) {
                callback.call(options.context, null, dataSet);
              }
            }
        ]);
      }
  );
  return this;
};

// Expose the root `Engine` instance publicly.
var exports = module.exports = new Engine();

// Expose the `Engine` class for customization and/or instantiation.
exports.Engine = Engine;

// Expose the version of `pathlength`.
exports.version = '0.1.0';
