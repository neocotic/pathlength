/*
 * Copyright (C) 2017 Alasdair Mercer
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

'use strict';

const async = require('async');
const debug = require('debugged').create('pathlength:api');
const EventEmitter = require('events').EventEmitter;
const fs = require('fs');
const path = require('path');

const Filter = require('./Filter');

const _checkChildren = Symbol('checkChildren');
const _checkFile = Symbol('checkFile');
const _getChildren = Symbol('getChildren');
const _getFileStats = Symbol('getFileStats');
const _getRealPath = Symbol('getRealPath');
const _hasReachedLimit = Symbol('hasReachedLimit');

/**
 * TODO: Document
 */
class PathLength extends EventEmitter {

  static [_getChildren](filePath, force) {
    return new Promise((resolve, reject) => {
      fs.readdir(filePath, (error, children) => {
        if (error) {
          if (force) {
            debug.log(`Ignoring error since force is enabled: ${error}`);

            resolve([]);
          } else {
            reject(error);
          }
        } else {
          resolve(children);
        }
      });
    });
  }

  static [_getFileStats](filePath) {
    return new Promise((resolve, reject) => {
      fs.lstat(filePath, (error, stats) => {
        if (error) {
          reject(error);
        } else {
          resolve(stats);
        }
      });
    });
  }

  static [_getRealPath](filePath) {
    return new Promise((resolve, reject) => {
      fs.realpath(filePath, (error, realFilePath) => {
        if (error) {
          reject(error);
        } else {
          resolve(realFilePath);
        }
      });
    });
  }

  /**
   * Creates an instance of {@link PathLength}.
   *
   * @public
   */
  constructor() {
    super();

    debug.log('Initialized PathLength');
  }

  /**
   * TODO: Document
   *
   * @param {PathLength~CheckOptions} [options] -
   * @return {Promise.<Error, Array.<PathLength~Result>>}
   * @fires PathLength#check
   * @fires PathLength#checkpath
   * @fires PathLength#end
   * @fires PathLength#result
   * @public
   */
  check(options) {
    options = Object.assign({
      cwd: process.cwd(),
      filter: null,
      force: false,
      limit: -1,
      recursive: false
    }, options);

    if (typeof options.filter === 'string') {
      try {
        options.filter = Filter.parse(options.filter);
      } catch (e) {
        debug.log('Failed to parse filter "%s": %s', options.filter, e);

        return Promise.reject(e);
      }
    }

    debug.log('Checking path lengths using filter "%s" with options: %o', options.filter, options);

    /**
     * TODO: Document
     *
     * @event PathLength#check
     * @type {Object}
     * @property {PathLength~CheckOptions} options -
     */
    this.emit('check', { options });

    const results = [];

    return PathLength[_getRealPath](options.cwd)
      .then((filePath) => this[_checkFile](filePath, results, options))
      .then(() => {
        results.sort((a, b) => a.path.localeCompare(b.path));

        debug.log('Check completed with results: %o', results);

        /**
         * TODO: Document
         *
         * @event PathLength#end
         * @type {Object}
         * @property {PathLength~CheckOptions} options -
         * @property {PathLength~Result[]} results -
         */
        this.emit('end', { options, results });

        return results;
      });
  }

  [_checkChildren](filePath, children, results, options) {
    return new Promise((resolve, reject) => {
      async.eachSeries(
        children,
        async.asyncify((child) => this[_checkFile](path.join(filePath, child), results, options)),
        (error) => {
          if (error) {
            reject(error);
          } else {
            resolve();
          }
        }
      );
    });
  }

  // Check the path of the given `file` against the filter.
  // If recursive mode is enabled, continue to traverse the file system and check its children.
  [_checkFile](filePath, results, options) {
    debug.log('Checking path "%s"', filePath);

    /**
     * TODO: Document
     *
     * @event PathLength#checkpath
     * @type {Object}
     * @property {string} path -
     */
    this.emit('checkpath', { path: filePath });

    return PathLength[_getFileStats](filePath)
      .then((stats) => {
        const directory = stats.isDirectory();

        if ((!options.filter || options.filter.check(filePath)) && !this[_hasReachedLimit](results, options)) {
          const result = {
            directory,
            length: filePath.length,
            path: filePath
          };

          results.push(result);

          debug.log('Path found: %o', result);

          /**
           * TODO: Document
           *
           * @event PathLength#result
           * @type {PathLength~Result}
           */
          this.emit('result', result);
        } else {
          debug.log('Path did not match filter: %s', filePath);
        }

        const recurse = directory && (options.recursive || filePath === options.cwd) && !stats.isSymbolicLink();

        if (!this[_hasReachedLimit](results, options) && recurse) {
          return PathLength[_getChildren](filePath, options.force);
        }

        return [];
      })
      .then((children) => this[_checkChildren](filePath, children, results, options));
  }

  [_hasReachedLimit](results, options) {
    return options.limit >= 0 && results.length >= options.limit;
  }

}

module.exports = PathLength;

/**
 * TODO: Document
 *
 * @typedef {Object} PathLength~CheckOptions
 * @property {string} [cwd] -
 * @property {Filter|string} [filter] -
 * @property {boolean} [force] -
 * @property {number} [limit=-1] -
 * @property {boolean} [recursive] -
 */

/**
 * TODO: Document
 *
 * @typedef {Object} PathLength~Result
 * @property {boolean} directory -
 * @property {number} length -
 * @property {string} path -
 */
