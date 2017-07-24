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

const _aliases = Symbol('aliases');
const _evaluator = Symbol('evaluator');
const _name = Symbol('name');
const _operators = Symbol('operators');

/**
 * TODO: Document
 */
class Operator {

  /**
   * TODO: Document
   *
   * @param {string} value -
   * @return {Operator}
   * @throws {Error}
   * @public
   */
  static parse(value) {
    debug.log('Attempting to parse operator from "%s"', value);

    let result;

    for (const key of Operator[_operators]) {
      const operator = Operator[key];

      if (operator[_name] === value || operator[_aliases].indexOf(value) !== -1) {
        result = operator;
        break;
      }
    }

    if (!result) {
      throw new Error(`Invalid operator: ${value}`);
    }

    debug.log('Operator "%s" parsed from "%s"', result, value);

    return result;
  }

  /**
   * TODO: Document
   *
   * @param {string} name -
   * @param {string[]} aliases -
   * @param {Operator~Evaluator} evaluator -
   * @protected
   */
  constructor(name, aliases, evaluator) {
    this[_name] = name;
    this[_aliases] = aliases;
    this[_evaluator] = evaluator;
  }

  /**
   * TODO: Document
   *
   * @param {*} lhs -
   * @param {*} rhs -
   * @return {boolean}
   * @public
   */
  evaluate(lhs, rhs) {
    return this[_evaluator](lhs, rhs);
  }

  /**
   * @override
   * @inheritDoc
   */
  toString() {
    return this[_name];
  }

  /**
   * TODO: Document
   *
   * @return {string}
   * @public
   */
  get name() {
    return this[_name];
  }

}

Operator.EQUALS = new Operator('eq', [ '=', '==', '===' ], (lhs, rhs) => lhs === rhs);
Operator.GREATER_THAN = new Operator('gt', [ '>' ], (lhs, rhs) => lhs > rhs);
Operator.GREATER_THAN_OR_EQUAL_TO = new Operator('gte', [ '>=' ], (lhs, rhs) => lhs >= rhs);
Operator.LESS_THAN = new Operator('lt', [ '<' ], (lhs, rhs) => lhs < rhs);
Operator.LESS_THAN_OR_EQUAL_TO = new Operator('lte', [ '<=' ], (lhs, rhs) => lhs <= rhs);
Operator.NOT_EQUALS = new Operator('ne', [ '!', '!=', '!==' ], (lhs, rhs) => lhs !== rhs);

Operator[_operators] = [
  'EQUALS',
  'GREATER_THAN',
  'GREATER_THAN_OR_EQUAL_TO',
  'LESS_THAN',
  'LESS_THAN_OR_EQUAL_TO',
  'NOT_EQUALS'
];

module.exports = Operator;

/**
 * TODO: Document
 *
 * @callback Operator~Evaluator
 * @param {*} lhs -
 * @param {*} rhs -
 * @return {boolean}
 */
