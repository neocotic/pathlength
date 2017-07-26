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
 * Can apply a format style to the command-line output.
 *
 * Implementations should have a unique style that has a single purpose (e.g. supports a single markup language or
 * syntax) and <b>must</b> be registered using {@link Style.register} in order to be available at runtime.
 *
 * The {@link Style#apply} method is used to bind event listeners to a {@link PathLength} instance which are used to be
 * notified to write to the output stream. The only configurable aspect is the <code>pretty</code> option which can be
 * interpreted differently, or even ignored, by each style.
 *
 * Ideally, styles output results as they come in, however, this is not a requirement and they are free to wait until
 * all results have been collected if they choose.
 */
class Style {

  /**
   * Returns the default {@link Style}.
   *
   * @return {Style} The default style.
   * @public
   */
  static getDefault() {
    return Style[_default];
  }

  /**
   * Finds the {@link Style} whose name matches the specified <code>name</code>.
   *
   * This method will return <code>null</code> if no style could be found for <code>name</code>.
   *
   * @param {string} name - the name of the style to be returned
   * @return {?Style} The style whose names matches <code>name</code> or <code>null</code> if none could be found.
   * @public
   */
  static lookup(name) {
    return Style[_instances].get(name);
  }

  /**
   * Registers the specified <code>style</code>, optionally indicating that it is also to be registered as the default
   * {@link Style}.
   *
   * <code>style</code> can either be an instance of {@link Style} or a constructor for one. If the latter, it will be
   * initialized and the resulting instance will be registered.
   *
   * If a style with of the same name has already been registered, it will be silently replaced by <code>style</code>.
   * Likewise if a style has already been registered as the default and <code>defaultStyle</code> is <code>true</code>.
   *
   * @param {Function|Style} style - the {@link Style} to be registered or its constructor
   * @param {boolean} [defaultStyle] - <code>true</code> to register <code>style</code> as the default {@link Style};
   * otherwise <code>false</code>
   * @return {Style} A reference to <code>style</code> if it's an instance of {@link Style}; otherwise the instance
   * created when <code>style</code> was instantiated.
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
   * Applies this {@link Style} using the <code>options</code> provided.
   *
   * The <code>pathLength</code> option is the {@link PathLength} instance to which this style is to be applied.
   * Normally, styles will register event listeners on the instance to be notified when they should write to the output
   * stream.
   *
   * The <code>outputStream</code> option is to be used to write output.
   *
   * The <code>pretty</code> option is not applicable to all styles and each implementation can determine how it is
   * applied or whether it's ignored entirely. When enabled, styles should attempt to make their output "prettier" as
   * standard output should be the minimal possible.
   *
   * @param {Style~ApplyOptions} options - the options to be used
   * @return {void}
   * @public
   * @abstract
   */
  apply(options) {
    pollock(Style, 'apply');
  }

  /**
   * Returns the name of this {@link Style}.
   *
   * This is used by {@link CLI} when looking up styles based on the value passed to the <code>--style</code> option.
   *
   * Implementations <b>must</b> override this method.
   *
   * @return {string} The name.
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
 * @property {PathLength} pathLength - The {@link PathLength} instance to which the {@link Style} is to be applied.
 * @property {boolean} pretty - <code>true</code> to output "prettier" formatting; otherwise <code>false</code>. Can be
 * ignored as it's not applicable to all styles.
 */
