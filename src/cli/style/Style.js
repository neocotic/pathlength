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

const debug = require('debugged').create('pathlength:cli:style');
const pollock = require('pollock');

const _default = Symbol('default');
const _instances = Symbol('instances');

/**
 * TODO: Document
 */
class Style {

  /**
   * TODO: Document
   *
   * @return {Style}
   * @public
   */
  static getDefault() {
    return Style[_default];
  }

  /**
   * TODO: Document
   *
   * @param {string} name -
   * @return {?Style}
   * @public
   */
  static lookup(name) {
    return Style[_instances].get(name);
  }

  /**
   * TODO: Document
   *
   * @param {Function|Style} style -
   * @param {boolean} [defaultStyle] -
   * @return {Style}
   * @public
   */
  static register(style, defaultStyle) {
    /* eslint-disable new-cap */
    const instance = typeof style === 'function' ? new style() : style;
    /* eslint-enable new-cap */
    const name = instance.getName();

    if (Style[_instances].has(name)) {
      debug.log('Overwriting registered style: %s', name);
    }

    Style[_instances].set(name, instance);

    if (defaultStyle) {
      debug.log('Setting default style to "%s"', name);

      Style[_default] = instance;
    }

    return instance;
  }

  /**
   * TODO: Document
   *
   * @param {Style~ApplyOptions} options -
   * @return {void}
   * @public
   * @abstract
   */
  apply(options) {
    pollock(Style, 'apply');
  }

  /**
   * TODO: Document
   *
   * @return {string}
   * @public
   * @abstract
   */
  getName() {
    pollock(Style, 'getName');
  }

  /**
   * @override
   * @inheritDoc
   */
  toString() {
    return this.getName();
  }

}

Style[_instances] = new Map();

module.exports = Style;

/**
 * The options that can be passed to {@link Style#apply}.
 *
 * @typedef {Object} Style~ApplyOptions
 * @property {Writable} outputStream - The stream for output messages to be written to.
 * @property {PathLength} pathLength - TODO: Document
 * @property {boolean} pretty - TODO: Document
 */
