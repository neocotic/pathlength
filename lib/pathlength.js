/** Module dependencies. */
var EventEmitter = require('events').EventEmitter
  , _ = require('underscore')
  , async = require('async')
  , fs = require('fs');

/** Regular expressions. */
var r_filter = /(\*|[!=]=?|[><]=?|eq|ne|[gl]te?)[^\*\d]*(\*|\d*)/i
  , r_operand = /\*|\d*/
  , r_operator = /\*|[!=]=?|[><]=?|eq|ne|[gl]te?/i;

/** Expose the root engine. */
var exports = module.exports = new Engine;

/** Expose `Engine`. */
exports.Engine = Engine;

/** Expose the library version. */
exports.version = '1.0.0';

/** Initialize a new `Engine`. */
function Engine() {
  this.debug = false;
}

/** Inherit from `EventEmitter`. */
Engine.prototype.__proto__ = EventEmitter.prototype;

Engine.prototype.find = function(options, callback) {
  var self = this;
  if (_.isFunction(options)) {
    callback = options;
    options = {};
  }
  if (!_.isFunction(callback)) callback = function() {};
  options = options || {};
  _.defaults(options, {
      filter: createFilter.call(this)
    , recursive: false
    , stop: false
    , target: process.cwd()
  });
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
  emit.call(this, 'start');
  async.waterfall([
          function(_callback) {
            fs.realpath(options.target, _callback);
          }
        , function(path, _callback) {
            if (self.debug) console.log('path: %s', path);
            traverse.call(self, [], options, path, path, _callback);
          }
      ]
    , function(err, dataSet) {
        if (err) throw err;
        // Sort `dataSet` alphabetically as async process may have distorted order
        dataSet.sort(function(curr, next) {
          return curr.path.localeCompare(next.path);
        });
        emit.call(self, 'beforeEnd', dataSet);
        async.parallel([
              function() {
                emit.call(self, 'end', dataSet);
              }
            , function() {
                callback.call(options.context, dataSet);
              }
          ]);
      });
  return this;
};

function checkFilter(filter, path) {
  var len = path.length
    , operator = filter[0]
    , operand = parseInt(filter[1]);
  if (operator !== '*' && !_.isNaN(operand)) {
    switch (operator) {
      case '!':
      case '!=':
      case 'ne':
        return len !== operand;
      case '=':
      case '==':
      case 'eq':
        return len == operand;
      case '>':
      case 'gt':
        return len > operand;
      case '>=':
      case 'gte':
        return len >= operand;
      case '<':
      case 'lt':
        return len < operand;
      case '<=':
      case 'lte':
        return len <= operand;
    }
  }
  return true;
}

function createFilter(value) {
  if (_.isString(value)) return createFilter.call(this, value.match(r_filter));
  var filter = ['*', '*'];
  if (_.isArray(value)) {
    if (r_operator.test(value[0])) filter[0] = value[0];
    if (r_operand.test(value[1])) filter[1] = value[1];
  }
  return filter;
}

function emit(event) {
  this.emit.apply(this
      , [event, { type: event }].concat(_.toArray(arguments).slice(1)));
  return this;
}

function traverse(dataSet, options, base, file, callback) {
  var self = this;
  async.waterfall([
          function(_callback) {
            fs.stat(file, _callback);
          }
        , function(stats, _callback) {
            var passed = checkFilter.call(self, options.filter, file)
              , data = {
                    path: file
                  , length: file.length
                  , directory: stats.isDirectory()
                };
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
            if ((passed || !options.stop) && data.directory && options.recursive) {
              fs.readdir(file, _callback);
            } else {
              _callback(null, []);
            }
          }
        , function(files, _callback) {
            if (files.length) {
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