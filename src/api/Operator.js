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
 * Defines a logical operator which can be used to evaluate the truth of an expression by comparing two values.
 *
 * An <code>Operator</code> can, and will, be commonly parsed from a string expression via {@link Operator.parse}.
 */
class Operator {

  /**
   * Parses the specified <code>value</code> as an operator expression (i.e. the first section of a filter expression).
   *
   * Operator expressions should contain only the name (e.g. <code>"gte"</code>) or an alias (e.g. <code>">="</code>) of
   * a predefined operator.
   *
   * An error will be thrown if <code>value</code> is invalid.
   *
   * @param {string} value - the string to be parsed as an operator expression
   * @return {Operator} The {@link Operator} parsed from <code>value</code>.
   * @throws {Error} If <code>value</code> is not a valid operator expression.
   * @public
   */
  static parse(value) {
    debug.log('Attempting to parse operator from "%s"', value);

    value = value.trim();

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
   * Creates an instance of {@link Operator} with the <code>name</code>, <code>aliases</code>, and
   * <code>evaluator</code> provided.
   *
   * <code>name</code> is used as the primary string representation for the {@link Operator}, however, it is used in
   * conjunction with <code>aliases</code> when it is being looked up using {@link Operator.parse}.
   *
   * <code>evaluator</code> is the function that will be invoked with both operands in order to make a logical
   * comparison.
   *
   * @param {string} name - the name to be used
   * @param {string[]} aliases - the aliases to be used
   * @param {Operator~Evaluator} evaluator - the evaluator to be used
   * @protected
   */
  constructor(name, aliases, evaluator) {
    this[_name] = name;
    this[_aliases] = aliases;
    this[_evaluator] = evaluator;
  }

  /**
   * Evaluates this logical {@link Operator} using the values provided.
   *
   * @param {*} lhs - the left-hand side operand
   * @param {*} rhs - the right-hand side operand
   * @return {boolean} The logical comparison for <code>lhs</code> and <code>rhs</code>.
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
   * Returns the name for this {@link Operator}.
   *
   * @return {string} The name.
   * @public
   */
  get name() {
    return this[_name];
  }

}

/**
 * The "equals" operator.
 *
 * @public
 * @static
 * @type {Operator}
 * @memberof Operator
 */
Operator.EQUALS = new Operator('eq', [ '=', '==', '===' ], (lhs, rhs) => lhs === rhs);

/**
 * The "greater than" operator.
 *
 * @public
 * @static
 * @type {Operator}
 * @memberof Operator
 */
Operator.GREATER_THAN = new Operator('gt', [ '>' ], (lhs, rhs) => lhs > rhs);

/**
 * The "greater than or equal to" operator.
 *
 * @public
 * @static
 * @type {Operator}
 * @memberof Operator
 */
Operator.GREATER_THAN_OR_EQUAL_TO = new Operator('gte', [ '>=' ], (lhs, rhs) => lhs >= rhs);

/**
 * The "less than" operator.
 *
 * @public
 * @static
 * @type {Operator}
 * @memberof Operator
 */
Operator.LESS_THAN = new Operator('lt', [ '<' ], (lhs, rhs) => lhs < rhs);

/**
 * The "less than or equal to" operator.
 *
 * @public
 * @static
 * @type {Operator}
 * @memberof Operator
 */
Operator.LESS_THAN_OR_EQUAL_TO = new Operator('lte', [ '<=' ], (lhs, rhs) => lhs <= rhs);

/**
 * The "not equals" operator.
 *
 * @public
 * @static
 * @type {Operator}
 * @memberof Operator
 */
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
 * A function which is called by {@link Operator} to evaluate the logical comparison of two values.
 *
 * This function is called internally by {@link Operator#evaluate}.
 *
 * @callback Operator~Evaluator
 * @param {*} lhs - the left-hand side operand
 * @param {*} rhs - the right-hand side operand
 * @return {boolean} The logical comparison for <code>lhs</code> and <code>rhs</code>.
 */
