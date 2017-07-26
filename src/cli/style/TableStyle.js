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

const EOL = require('os').EOL;
const rightPad = require('right-pad');

const Style = require('./Style');

const _calculateMaxWidths = Symbol('calculateMaxWidths');
const _outputDivider = Symbol('outputDivider');
const _outputHeaders = Symbol('outputHeaders');
const _outputRow = Symbol('outputRow');

/**
 * An implementation of {@link Style} that outputs the results in a table containing rows of elements in the following
 * form:
 *
 * <pre>
 * +-------------+---------------+------------------+
 * | Path        | Length        | Type             |
 * +-------------+---------------+------------------+
 * | PATH_STRING | LENGTH_NUMBER | FILE_TYPE_STRING |
 * +-------------+---------------+------------------+
 * </pre>
 *
 * When the <code>pretty</code> option is enabled, the column cells are padded so that they all share the same width
 * (just like the example above), however, nothing is written to the output stream until all results are in.
 */
class TableStyle extends Style {

  /**
   * @override
   * @inheritDoc
   */
  apply(options) {
    const columns = [
      {
        header: 'Path',
        maxWidth: 0,
        render(result) {
          return result.path;
        }
      },
      {
        header: 'Length',
        maxWidth: 0,
        render(result) {
          return String(result.length);
        }
      },
      {
        header: 'Type',
        maxWidth: 0,
        render(result) {
          return result.directory ? 'Directory' : 'File';
        }
      }
    ];
    const outputStream = options.outputStream;
    const pathLength = options.pathLength;
    const pretty = options.pretty;

    pathLength.on('check', () => {
      if (!pretty) {
        this[_outputDivider](outputStream, columns);
        this[_outputHeaders](outputStream, columns);
        this[_outputDivider](outputStream, columns);
      }
    });
    pathLength.on('result', (event) => {
      if (!pretty) {
        this[_outputRow](outputStream, columns, event);
      }
    });
    pathLength.on('end', (event) => {
      if (pretty) {
        this[_calculateMaxWidths](columns, event.results);

        this[_outputDivider](outputStream, columns);
        this[_outputHeaders](outputStream, columns);
        this[_outputDivider](outputStream, columns);

        event.results.forEach((result) => this[_outputRow](outputStream, columns, result));
      }

      this[_outputDivider](outputStream, columns);

      outputStream.write(EOL);
    });
  }

  /**
   * @override
   * @inheritDoc
   */
  getName() {
    return 'table';
  }

  [_calculateMaxWidths](columns, results) {
    for (const result of results) {
      for (const column of columns) {
        column.maxWidth = Math.max(column.render(result).length, column.header.length, column.maxWidth);
      }
    }
  }

  [_outputDivider](outputStream, columns) {
    for (const column of columns) {
      outputStream.write(`+-${'-'.repeat(Math.max(column.header.length, column.maxWidth))}-`);
    }

    outputStream.write(`+${EOL}`);
  }

  [_outputHeaders](outputStream, columns) {
    for (const column of columns) {
      outputStream.write(`| ${rightPad(column.header, column.maxWidth, ' ')} `);
    }

    outputStream.write(`|${EOL}`);
  }

  [_outputRow](outputStream, columns, result) {
    for (const column of columns) {
      outputStream.write(`| ${rightPad(column.render(result), column.maxWidth, ' ')} `);
    }

    outputStream.write(`|${EOL}`);
  }

}

Style.register(TableStyle);

module.exports = TableStyle;

/**
 * Defines a column for the table and how its data is presented.
 *
 * @typedef {Object} TableStyle~Column
 * @property {string} header - The text to be displayed in the column header.
 * @property {number} maxWidth - The maximum width of this column. Will be zero unless the <code>pretty</code> option is
 * enabled and the "end" event has been fired by the {@link PathLength} instance.
 * @property {TableStyle~ColumnRenderer} render - The column cell renderer.
 */

/**
 * A function which is called by {@link TableStyle} to render the text to be displayed in the column cell.
 *
 * @callback TableStyle~ColumnRenderer
 * @param {PathLength~Result} result - The result to be rendered.
 * @return {string} The cell text for <code>result</code>.
 */
