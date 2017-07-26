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
const yaml = require('js-yaml');

const Style = require('./Style');

/**
 * An implementation of {@link Style} that outputs the results as a YAML array containing elements the following form:
 *
 * <pre>
 * - directory: DIRECTORY_BOOLEAN
 *   length: LENGTH_NUMBER
 *   path: PATH_STRING
 * </pre>
 *
 * The <code>pretty</code> option is ignored by <code>YamlStyle</code>.
 */
class YamlStyle extends Style {

  /**
   * @override
   * @inheritDoc
   */
  apply(options) {
    const outputStream = options.outputStream;
    const pathLength = options.pathLength;
    const yamlOptions = {
      lineWidth: -1,
      noRefs: true
    };

    pathLength.on('result', (event) => {
      outputStream.write(`${yaml.safeDump([ event ], yamlOptions).replace(/\r\n?|\n/g, EOL)}`);
    });
    pathLength.on('end', () => outputStream.write(EOL));
  }

  /**
   * @override
   * @inheritDoc
   */
  getName() {
    return 'yaml';
  }

}

Style.register(YamlStyle);

module.exports = YamlStyle;
