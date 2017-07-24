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
 * TODO: Document
 */
class Filter {

  /**
   * TODO: Document
   *
   * @param {string} value -
   * @return {Filter}
   * @throws {Error}
   * @public
   */
  static parse(value) {
    debug.log('Attempting to parse filter from "%s"', value);

    const match = value.match(/^([^\d\s]+)\s*(\d+)$/);
    if (!match) {
      throw new Error(`Invalid filter: ${value}`);
    }
    const result = new Filter(match[1], parseInt(match[2], 10));

    debug.log('Filter "%s" parsed from "%s"', result, value);

    return result;
  }

  /**
   * TODO: Document
   *
   * @param {Operator|string} operator -
   * @param {number} operand -
   * @throws {Error}
   * @throws {RangeError}
   * @public
   */
  constructor(operator, operand) {
    if (typeof operator === 'string') {
      operator = Operator.parse(operator);
    }
    if (!operator) {
      throw new Error('Operator must be specified');
    }
    if (operand < 0) {
      throw new RangeError(`Operand must be positive: ${operand}`);
    }

    this[_operator] = operator;
    this[_operand] = Math.round(operand);
  }

  /**
   * TODO: Document
   *
   * @param {string} filePath -
   * @return {boolean}
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
   * TODO: Document
   *
   * @return {string}
   * @public
   */
  get operand() {
    return this[_operand];
  }

  /**
   * TODO: Document
   *
   * @return {Operator}
   * @public
   */
  get operator() {
    return this[_operator];
  }

}

module.exports = Filter;
