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
 * Can check and report the length of paths for files and directories that are scanned.
 *
 * Optionally, the results can be filtered using an expression to report only paths whose length match.
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
   * Scans files and directories within the current working directory and checks the length of their real path using the
   * <code>options</code> provided.
   *
   * The <code>cwd</code> option can be used to control which directory is scanned initially. By default, this will be
   * the current working directory.
   *
   * The <code>filter</code> option can be used to control which paths are included in the results based on their
   * length. It can be a string expression (e.g. <code>"gte 20"</code>, <code>">= 20"</code>) or a {@link Filter}. If no
   * <code>filter</code> option is specified, then all checked paths will be included in the results.
   *
   * The <code>force</code> option can be enabled to not fail when individual file checks throw errors (e.g. attempting
   * to list files within a directory that the current user does not have access to). By default, such errors will
   * result in the returned <code>Promise</code> being rejected.
   *
   * The <code>limit</code> option can be used to control the number of results that are returned before it stops
   * checking. When negative, the number of results is unlimited, which is the default behavior.
   *
   * The <code>recursive</code> option can be enabled to recursively search all directories within the <code>cwd</code>
   * and so on. By default, only files and directories located immediately within the <code>cwd</code> are checked.
   * Symbolic links are never followed.
   *
   * This method returns a <code>Promise</code> that is resolved with all results. However, progress can be monitored by
   * listening to events that are emitted by this {@link PathLength}.
   *
   * @param {PathLength~CheckOptions} [options] - the options to be used
   * @return {Promise.<Error, Array.<PathLength~Result>>} A <code>Promise</code> for all of the results.
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
     * The "check" event is fired once the options have been derived and the filter, if any, been parsed but before any
     * paths are scanned and checked.
     *
     * @event PathLength#check
     * @type {Object}
     * @property {PathLength~CheckOptions} options - The options to be used.
     */
    this.emit('check', { options });

    const results = [];

    return PathLength[_getRealPath](options.cwd)
      .then((filePath) => this[_checkFile](filePath, results, options))
      .then(() => {
        results.sort((a, b) => a.path.localeCompare(b.path));

        debug.log('Check completed with results: %o', results);

        /**
         * The "end" event is fired once all paths have been scanned and checked.
         *
         * @event PathLength#end
         * @type {Object}
         * @property {PathLength~CheckOptions} options - The options that were used.
         * @property {PathLength~Result[]} results - The results of the checks.
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
     * The "checkpath" event is fired immediately before a path is checked.
     *
     * @event PathLength#checkpath
     * @type {Object}
     * @property {PathLength~CheckOptions} options - The options to be used.
     * @property {string} path - The path to be checked.
     */
    this.emit('checkpath', { options, path: filePath });

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
           * The "result" event is fired immediately after a path is checked along with its findings.
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
 * The options that can be passed to {@link PathLength#check}.
 *
 * @typedef {Object} PathLength~CheckOptions
 * @property {string} [cwd] - The directory from which to begin scanning paths. This will be <code>process.cwd()</code>
 * by default.
 * @property {Filter|string} [filter] - The {@link Filter} (or filter expression to be parsed) to be used to control
 * which paths are included in the results. All paths checked are included by default.
 * @property {boolean} [force] - <code>true</code> to ignore errors for individual path checks; otherwise
 * <code>false</code>. Disabled by default.
 * @property {number} [limit=-1] - The maximum number of results. Unlimited if negative, which is the default.
 * @property {boolean} [recursive] - <code>true</code> to search for paths recursively within <code>cwd</code>;
 * otherwise <code>false</code>. Disabled by default.
 */

/**
 * Contains the result of an individual path check.
 *
 * @typedef {Object} PathLength~Result
 * @property {boolean} directory - <code>true</code> if the path that was checked was a directory; otherwise
 * <code>false</code>.
 * @property {number} length - The length of the path.
 * @property {string} path - The real path that was checked.
 */
