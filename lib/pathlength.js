/*!
 * pathlength
 * Copyright(c) 2013 Alasdair Mercer <mercer.alasdair@gmail.com>
 * MIT Licensed
 */

/**
 * Module dependencies.
 */

var EventEmitter = require('events').EventEmitter
  , _ = require('underscore')
  , async = require('async')
  , fs = require('fs');

/**
 * Regular expressions.
 * 
 * @api private
 */

var r_filter = /(\*|[!=]=?|[><]=?|eq|ne|[gl]te?)\s*([\*@]|\d*)/i
  , r_operand = /[\*@]|\d*/
  , r_operator = /\*|[!=]=?|[><]=?|eq|ne|[gl]te?/i;

/**
 * Expose the root engine.
 */

var exports = module.exports = new Engine;

/**
 * Expose `Engine`.
 */

exports.Engine = Engine;

/**
 * Expose the library version.
 * 
 * @type String
 * @api public
 */

exports.version = '0.1.0';

/**
 * Initialize a new `Engine`.
 * 
 * @api public
 */

function Engine() {
  this.debug = false;
}

/**
 * Inherit from `EventEmitter`.
 */

Engine.prototype.__proto__ = EventEmitter.prototype;

/**
 * Determine whether or not the given `path` passes the `filter`.
 * 
 * @param {Array} filter
 * @param {String} path
 * @return {Boolean}
 * @api private
 */

function checkFilter(filter, path) {
  var len = path.length
    , operator = filter[0]
    , operand = parseInt(filter[1]);
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
        return len == operand;
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

/**
 * Attempt to create a filter array from the given `value`.
 * 
 * If either the operator or operand cannot be derived, a wildcard character
 * will replace them in the returned filter array.
 * 
 * `@` can be used as the operand to represent the lenght of the target
 * file/directory.
 * 
 * Examples:
 * 
 *     // [">=", "20"]
 *     return createFilter('>=20');
 * 
 *     // ["*", "*"]
 *     return createFilter("foo");
 * 
 * @param {Array|String} [value]
 * @return {Array} filter array
 * @api private
 */

function createFilter(value) {
  // Attempt to parse `value` if it's a string
  if (_.isString(value)) {
    value = value.match(r_filter);
    return createFilter.call(this, value && value.slice(1));
  }
  var filter = ['*', '*'];
  // Only replace wildcard characters if valid alternatives can be derived
  if (_.isArray(value)) {
    if (r_operator.test(value[0])) filter[0] = value[0];
    if (r_operand.test(value[1])) filter[1] = value[1];
  }
  return filter;
}

/**
 * Wrapper for `EventEmitter.prototype.emit`, used to ensure handlers always
 * know that the given `event` was triggered.
 * 
 * All other arguments will be passed to the handler(s).
 * 
 * @param {String} event
 * @param {Mixed} args...
 * @return {Engine} for chaining
 * @api private
 */

function emit(event) {
  this.emit.apply(this
      , [event, { type: event }].concat(_.toArray(arguments).slice(1)));
  return this;
}

/**
 * Filter the target file/directory and/or all children using the options
 * provided.
 * 
 * @param {Object} [options]
 * @param {Mixed} [options.context]
 * @param {Array|String} [options.filter]
 * @param {Boolean} [options.recursive]
 * @param {Boolean} [options.stop]
 * @param {String} [options.target]
 * @param {Function} [callback]
 * @return {Engine} for chaining
 * @api public
 */

Engine.prototype.filter = function(options, callback) {
  var self = this;
  // Handle optional arguments
  if (_.isFunction(options)) {
    callback = options;
    options = {};
  }
  // Handle default options
  options = options || {};
  _.defaults(options, {
      filter: createFilter.call(this)
    , recursive: false
    , stop: false
    , target: process.cwd()
  });
  // Create valid filter
  options.filter = createFilter.call(this, options.filter);
  if (this.debug) {
    console.log('callback: %j', callback);
    console.log('context: %j', _.has(options, 'context'));
    console.log('filter: %j', options.filter);
    console.log('recursive: %j', options.recursive);
    console.log('stop: %j', options.stop);
    console.log('target: %j', options.target);
    console.log('');
  }
  // Let's get the show started
  emit.call(this, 'start');
  async.waterfall([
          function(_callback) {
            // Derive actual path for target file/directory
            fs.realpath(options.target, _callback);
          }
        , function(path, _callback) {
            // Replace special filter characters
            specialFilter.call(self, options.filter, { target: path });
            // Check `path` passes filter and check directory contents where
            // appropriate
            traverse.call(self, [], options, path, path, _callback);
          }
      ]
    , function(err, dataSet) {
        if (err) {
          if (_.isFunction(callback)) {
            callback.call(options.context, err);
          } else {
            throw err;
          }
        }
        // Sort `dataSet` alphabetically as async may have distorted order
        dataSet.sort(function(curr, next) {
          return curr.path.localeCompare(next.path);
        });
        // Finalize the process.
        emit.call(self, 'beforeEnd', dataSet);
        async.parallel([
              function() {
                emit.call(self, 'end', dataSet);
              }
            , function() {
                if (_.isFunction(callback)) {
                  callback.call(options.context, null, dataSet);
                }
              }
          ]);
      });
  return this;
};

/**
 * Replace special filter characters with thier corresponding values.
 * 
 * @param {Array} filter
 * @param {Object} data
 * @param {String} data.target
 * @return {Engine} for chaining
 * @api private
 */

function specialFilter(filter, data) {
  if ('@' === filter[1]) filter[1] = String(data.target.length);
  return this;
}

/**
 * Check the path of the given `file` against the filter.
 * 
 * If recursive mode is enabled, continue to traverse the file system and check
 * its children.
 * 
 * @param {Array} dataSet
 * @param {Object} options
 * @param {String} base
 * @param {String} file
 * @param {Function} callback
 * @return {Engine} for chaining
 * @api private
 */

function traverse(dataSet, options, base, file, callback) {
  var self = this;
  async.waterfall([
          function(_callback) {
            // Fetch the file statistics
            fs.stat(file, _callback);
          }
        , function(stats, _callback) {
            // Validate path against the filter array and create data object
            var passed = checkFilter.call(self, options.filter, file)
              , data = {
                    path: file
                  , length: file.length
                  , directory: stats.isDirectory()
                };
            // Trigger events in the correct order while storing the data
            if (passed) {
              if (dataSet.length) {
                emit.call(self, 'betweenData');
              } else {
                emit.call(self, 'afterStart');
              }
              emit.call(self, 'beforeData', data);
              dataSet.push(data);
              emit.call(self, 'data', data);
              emit.call(self, 'afterData', data);
            }
            // Check if the directory's children should be checked
            if ((passed || !options.stop) && data.directory
                && options.recursive) {
              fs.readdir(file, _callback);
            } else {
              _callback(null, []);
            }
          }
        , function(files, _callback) {
            if (files.length) {
              // Check all of the children `files`
              async.parallel(
                  files.map(function(name) {
                    return function(__callback) {
                      // TODO: Test path seperator works cross-platform
                      traverse.call(self, dataSet, options, base
                          , file + '\\' + name, __callback);
                    };
                  })
                , function(err, results) {
                    _callback(err, results);
                  });
            } else {
              _callback(null);
            }
          }
      ]
    , function(err) {
        callback(err, dataSet);
      });
  return this;
}