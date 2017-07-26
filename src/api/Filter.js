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

const debug = require('debugged').create('pathlength:api');

const Operator = require('./Operator');

const _operand = Symbol('operand');
const _operator = Symbol('operator');

/**
 * Can be used to filter which check paths are included in the results of {@link PathLength#check}.
 *
 * A <code>Filter</code> can, and will, be commonly parsed from a string expression via {@link Filter.parse}.
 */
class Filter {

  /**
   * Parses the specified <code>value</code> as a filter expression.
   *
   * Filter expressions are made up of an {@link Operator} (e.g. <code>"gte"</code>, <code>">="</code>) and an operand
   * (i.e. path length comparable), optionally separated by white space.
   *
   * An error will be thrown if any part of <code>value</code> is invalid.
   *
   * @param {string} value - the string to be parsed as a filter expression
   * @return {Filter} The {@link Filter} parsed from <code>value</code>.
   * @throws {Error} If <code>value</code> is not a valid filter expression.
   * @public
   */
  static parse(value) {
    debug.log('Attempting to parse filter from "%s"', value);

    value = value.trim();

    const match = value.match(/^([^1-9\s]+)\s*([1-9]\d*)$/);
    if (!match) {
      throw new Error(`Invalid filter: ${value}`);
    }
    const result = new Filter(match[1], match[2]);

    debug.log('Filter "%s" parsed from "%s"', result, value);

    return result;
  }

  /**
   * Creates an instance of {@link Filter} with the <code>operator</code> and <code>operand</code> provided.
   *
   * If <code>operator</code> is a string, it will be parsed using {@link Operator.parse}. Similarly, if
   * <code>operand</code> is a string, it will be transformed into a number.
   *
   * <code>operand</code> must be a positive number.
   *
   * @param {Operator|string} operator - the {@link Operator} (or a string from which it is to be parsed) to be used
   * @param {number|string} operand - the operand to be used
   * @throws {Error} If either <code>operator</code> or <code>operand</code> are invalid.
   * @throws {RangeError} If <code>operand</code> is negative.
   * @public
   */
  constructor(operator, operand) {
    if (typeof operator === 'string') {
      operator = Operator.parse(operator);
    }
    if (typeof operand === 'string') {
      operand = parseInt(operand, 10);
    }
    if (!operator) {
      throw new Error('Operator must be specified');
    }
    if (typeof operand !== 'number' || Number.isNaN(operand)) {
      throw new Error(`Operand must be a number: ${operand}`);
    }
    if (operand < 0) {
      throw new RangeError(`Operand must be positive: ${operand}`);
    }

    this[_operator] = operator;
    this[_operand] = Math.round(operand);
  }

  /**
   * Checks whether this {@link Filter} passes for the specified file path.
   *
   * This is done by evaluating the {@link Operator} using the length of <code>filePath</code> and the operand.
   *
   * @param {string} filePath - the file path to be checked
   * @return {boolean} <code>true</code> if <code>filePath</code> passes the filter; otherwise <code>false</code>.
   * @public
   */
  check(filePath) {
    return this[_operator].evaluate(filePath.length, this[_operand]);
  }

  /**
   * @override
   * @inheritDoc
   */
  toString() {
    return `${this[_operator]} ${this[_operand]}`;
  }

  /**
   * Returns the operand for this {@link Filter}.
   *
   * @return {number} The operand.
   * @public
   */
  get operand() {
    return this[_operand];
  }

  /**
   * Returns the {@link Operator} for this {@link Filter}.
   *
   * @return {Operator} The operator.
   * @public
   */
  get operator() {
    return this[_operator];
  }

}

module.exports = Filter;
