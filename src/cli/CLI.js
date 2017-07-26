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

/* eslint "no-process-exit": "off" */

const Command = require('commander').Command;
const Debugged = require('debugged');
const debug = Debugged.create('pathlength:cli');
const EOL = require('os').EOL;
const path = require('path');

const PathLength = require('../api/PathLength');
const pkg = require('../../package.json');
const Style = require('./style/Style');

const _command = Symbol('command');
const _errorStream = Symbol('errorStream');
const _outputStream = Symbol('outputStream');

/**
 * The command-line interface for {@link PathLength}.
 *
 * While technically part of the API, this is not expected to be used outside of this package as it's only intended use
 * is by <code>bin/pathlength</code>.
 */
class CLI {

  /**
   * Creates an instance of {@link CLI} using the <code>options</code> provided.
   *
   * <code>options</code> is primarily intended for testing purposes and it's not expected to be supplied in any
   * real-world scenario.
   *
   * @param {CLI~Options} [options] - the options to be used
   * @public
   */
  constructor(options) {
    if (!options) {
      options = {};
    }

    this[_errorStream] = options.errorStream || process.stderr;
    this[_outputStream] = options.outputStream || process.stdout;
    this[_command] = new Command()
      .version(pkg.version)
      .usage('[options] [file]')
      .option('-d, --debug', 'enable debug level logging')
      .option('-f, --filter <expression>', 'filter paths by length')
      .option('-F, --force', 'ignore errors for individual path checks')
      .option('-l, --limit <max>', 'limit number of results', parseInt)
      .option('-p, --pretty', 'enable pretty formatting for supporting styles')
      .option('-r, --recursive', 'search directories recursively')
      .option('--stack', 'print stack traces for errors')
      .option('-s, --style <name>', 'use style for output')
      .on('option:debug', () => Debugged.enable('*'));
  }

  /**
   * Parses the command-line (process) arguments provided and performs the necessary actions based on the parsed input.
   *
   * @param {string[]} [args] - the arguments to be parsed
   * @return {void}
   * @public
   */
  parse(args) {
    if (!args) {
      args = [];
    }

    debug.log('Parsing arguments: %o', args);

    const command = this[_command].parse(args);
    const options = {
      cwd: path.resolve(command.args[0] || process.cwd()),
      filter: command.filter || null,
      force: command.force,
      limit: command.limit != null ? command.limit : -1,
      recursive: command.recursive
    };
    const pathLength = new PathLength();
    let style;

    if (command.style) {
      style = Style.lookup(command.style);
      if (!style) {
        throw new Error(`Invalid style: ${command.style}`);
      }
    } else {
      style = Style.getDefault();
    }

    style.apply({
      outputStream: this[_outputStream],
      pathLength,
      pretty: command.pretty
    });

    pathLength.check(options)
      .catch((error) => {
        this[_errorStream].write(`${EOL}pathlength failed: ${command.stack ? error.stack : error.message}${EOL}`);

        if (!command.stack) {
          this[_errorStream].write(`Try again with the --stack option to print the full stack trace${EOL}`);
        }
      });
  }

}

module.exports = CLI;

/**
 * The options that can be passed to {@link CLI}.
 *
 * @typedef {Object} CLI~Options
 * @property {Writable} [errorStream=process.stderr] - The stream for error messages to be written to.
 * @property {Writable} [outputStream=process.stdout] - The stream for output messages to be written to.
 */
