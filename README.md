    8888888b.          888    888
    888   Y88b         888    888
    888    888         888    888
    888   d88P 8888b.  888888 88888b.
    8888888P"     "88b 888    888 "88b
    888       .d888888 888    888  888
    888       888  888 Y88b.  888  888
    888       "Y888888  "Y888 888  888
       888                                888    888
       888                                888    888
       888                                888    888
       888      .d88b.  88888b.   .d88b.  888888 88888b.
       888     d8P  Y8b 888 "88b d88P"88b 888    888 "88b
       888     88888888 888  888 888  888 888    888  888
       888     Y8b.     888  888 Y88b 888 Y88b.  888  888
       88888888 "Y8888  888  888  "Y88888  "Y888 888  888
                                      888
                                 Y8b d88P
                                  "Y88P"

[PathLength](https://github.com/neocotic/pathlength) is a [Node.js](https://nodejs.org) module for checking the lengths
of file paths.

[![Build Status](https://img.shields.io/travis/neocotic/pathlength/develop.svg?style=flat-square)](https://travis-ci.org/neocotic/pathlength)
[![Dependency Status](https://img.shields.io/david/neocotic/pathlength.svg?style=flat-square)](https://david-dm.org/neocotic/pathlength)
[![Dev Dependency Status](https://img.shields.io/david/dev/neocotic/pathlength.svg?style=flat-square)](https://david-dm.org/neocotic/pathlength?type=dev)
[![License](https://img.shields.io/npm/l/pathlength.svg?style=flat-square)](https://github.com/neocotic/pathlength/blob/master/LICENSE.md)
[![Release](https://img.shields.io/npm/v/pathlength.svg?style=flat-square)](https://www.npmjs.com/package/pathlength)

* [Install](#install)
* [CLI](#cli)
* [API](#api)
* [Filters](#filters)
* [Bugs](#bugs)
* [Contributors](#contributors)
* [License](#license)

## Install

Install using `npm`:

``` bash
$ npm install --save pathlength
```

You'll need to have at least [Node.js](https://nodejs.org) 4 or newer.

If you want to use the command line interface, which you probably do, you'll most likely want to install it globally so
that you can run `pathlength` from anywhere:

``` bash
$ npm install --global pathlength
```

## CLI

    Usage: pathlength [options] [file]
    
    
    Options:
    
      -V, --version              output the version number
      -d, --debug                enable debug level logging
      -f, --filter <expression>  filter paths by length
      -F, --force                ignore errors for individual path checks
      -l, --limit <max>          limit number of results
      -p, --pretty               enable pretty formatting for supporting styles
      -r, --recursive            search directories recursively
      --stack                    print stack traces for errors
      -s, --style <name>         use style for output
      -h, --help                 output usage information

The command line interface is the primary intended use for PathLength and it's designed to be extremely simple and works
on an opt-in principle.

### Styles

As mentioned above, the CLI accepts a `style` option which, when specified, changes how the results are presented.

The `pretty` option can also be used to instruct styles to make present themselves *prettier*, however, this option is
not supported by all styles, only those where it makes sense.

#### plain

This is the default style and outputs results in a plain format.

    $ pathlength src
    /home/neocotic/dev/pathlength/src [33, directory]
    /home/neocotic/dev/pathlength/src/api [37, directory]
    /home/neocotic/dev/pathlength/src/cli [37, directory]
    /home/neocotic/dev/pathlength/src/index.js [42, file]

The `pretty` option is ignored by this style.

#### csv

This style outputs each result as comma-separated values.

    $ pathlength -s csv src
    "/home/neocotic/dev/pathlength/src","33","true"
    "/home/neocotic/dev/pathlength/src/api","37","true"
    "/home/neocotic/dev/pathlength/src/cli","37","true"
    "/home/neocotic/dev/pathlength/src/index.js","42","false"

The `pretty` option is ignored by this style.

#### json

This style outputs the results as a JSON array.

    $ pathlength -s json src
    [{"directory":true,"length":33,"path":"/home/neocotic/dev/pathlength/src"},{"directory":true,"length":37,"path":"/home/neocotic/dev/pathlength/src/api"},{"directory":true,"length":37,"path":"/home/neocotic/dev/pathlength/src/cli"},{"directory":false,"length":42,"path":"/home/neocotic/dev/pathlength/src/index.js"}]

The `pretty` option will format the JSON nicely with good spacing, indentation, and spans multiple lines.

    $ pathlength -ps json src
    [
      {
        "directory": true,
        "length": 33,
        "path": "/home/neocotic/dev/pathlength/src"
      },
      {
        "directory": true,
        "length": 37,
        "path": "/home/neocotic/dev/pathlength/src/api"
      },
      {
        "directory": true,
        "length": 37,
        "path": "/home/neocotic/dev/pathlength/src/cli"
      },
      {
        "directory": false,
        "length": 42,
        "path": "/home/neocotic/dev/pathlength/src/index.js"
      }
    ]

#### table

This style outputs the results as a table.

    $ pathlength -s table src
    +------+--------+------+
    | Path | Length | Type |
    +------+--------+------+
    | /home/neocotic/dev/pathlength/src | 33 | Directory |
    | /home/neocotic/dev/pathlength/src/api | 37 | Directory |
    | /home/neocotic/dev/pathlength/src/cli | 37 | Directory |
    | /home/neocotic/dev/pathlength/src/index.js | 42 | File |
    +------+--------+------+

The `pretty` option will format the table nicely with padded cells for aligned columns.

    $ pathlength -ps table src
    +--------------------------------------------+--------+-----------+
    | Path                                       | Length | Type      |
    +--------------------------------------------+--------+-----------+
    | /home/neocotic/dev/pathlength/src          | 33     | Directory |
    | /home/neocotic/dev/pathlength/src/api      | 37     | Directory |
    | /home/neocotic/dev/pathlength/src/cli      | 37     | Directory |
    | /home/neocotic/dev/pathlength/src/index.js | 42     | File      |
    +--------------------------------------------+--------+-----------+

However, using the `pretty` option with this style does mean that nothing is written to the output stream until all
results are in. This is because the maximum column width cannot be calculated until all of the data is available.

#### xml

This style outputs the results as a XML document.

    $ pathlength -s xml src
    <?xml version="1.0" encoding="UTF-8" ?><results><result directory="true" length="33" path="/home/neocotic/dev/pathlength/src" /><result directory="true" length="37" path="/home/neocotic/dev/pathlength/src/api" /><result directory="true" length="37" path="/home/neocotic/dev/pathlength/src/cli" /><result directory="false" length="42" path="/home/neocotic/dev/pathlength/src/index.js" /></results>

The `pretty` option will format the XML nicely with good indentation and spans multiple lines.

    $ pathlength -ps xml src
    <?xml version="1.0" encoding="UTF-8" ?>
    <results>
      <result directory="true" length="33" path="/home/neocotic/dev/pathlength/src" />
      <result directory="true" length="37" path="/home/neocotic/dev/pathlength/src/api" />
      <result directory="true" length="37" path="/home/neocotic/dev/pathlength/src/cli" />
      <result directory="false" length="42" path="/home/neocotic/dev/pathlength/src/index.js" />
    </results>

#### yaml

This style outputs the results as a YAML array.

    $ pathlength -s yaml src
    [{directory: true, length: 33, path: /home/neocotic/dev/pathlength/src}, {directory: true, length: 37, path: /home/neocotic/dev/pathlength/src/api}, {directory: true, length: 37, path: /home/neocotic/dev/pathlength/src/cli}, {directory: false, length: 42, path: /home/neocotic/dev/pathlength/src/index.js}]

The `pretty` option will format the YAML nicely with good indentation and spans multiple lines.

    $ pathlength -ps yaml src
    - directory: true
      length: 33
      path: /home/neocotic/dev/pathlength/src
    - directory: true
      length: 37
      path: /home/neocotic/dev/pathlength/src/api
    - directory: true
      length: 37
      path: /home/neocotic/dev/pathlength/src/cli
    - directory: false
      length: 42
      path: /home/neocotic/dev/pathlength/src/index.js

## API

While most of you will be using PathLength via its CLI, the API can also be used and is designed to be just as simple to
use. It uses ECMAScript 2015's promises to handle the asynchronous flow:

It's best to take a look at the code and or inspect the results yourself to see all of the information available.

### `check([options])`

Scans files and directories within the current working directory and checks the length of their real path using the
`options` provided.

This method returns a `Promise` that is resolved with all results. However, progress can be monitored by listening to
events that are emitted by `pathlength`.

#### Options

| Option      | Description                                                                                                | Default         |
| ----------- | ---------------------------------------------------------------------------------------------------------- | --------------- |
| `cwd`       | Directory from which to begin scanning paths                                                               | `process.cwd()` |
| `filter`    | `Filter` (or filter expression to be parsed) to be used to control which paths are included in the results | *All*           |
| `force`     | Enable to ignore errors for individual path checks                                                         | `false`         |
| `limit`     | Maximum number of results (unlimited if negative)                                                          | *Unlimited*     |
| `recursive` | Search for paths recursively within `cwd`                                                                  | `false`         |

#### Events

| Event       | Description                                                                                                               |
| ----------- | ------------------------------------------------------------------------------------------------------------------------- |
| `check`     | Fired once the options have been derived and the filter, if any, been parsed but before any paths are scanned and checked |
| `checkpath` | Fired immediately before a path is checked                                                                                |
| `result`    | Fired immediately after a path is checked along with its findings                                                         |
| `end`       | Fired once all paths have been scanned and checked                                                                        |

#### Examples

``` javascript
pathlength.check({ cwd: '/', filter: '>255', force: true, recursive: true })
  .then((results) => {
    console.log(`${results.length} paths found that are longer than 255 characters`);
  });
```

## Filters

While using the CLI, you'll always be using filter expressions; strings that are parsed into filter objects. This will
be common for the API as well as it's much easier and cleaner to read.

A filter consists of a logical operator followed by an operand that is evaluated against the length of each path. The
operand can only consist of positive numerical value. The parser for filter expressions is quite strict and will throw
an error if it doesn't match the expected pattern. Any leading, trailing, or separating whitespace is ignored by the
parser.

The following operators are supported and each can be imported directly via the API exposed by `src/api/Operator`, if
needed. 

| Operator | Aliases        | API                        | Description              |
| -------- | -------------- | -------------------------- | ------------------------ |
| `eq`     | `=` `==` `===` | `EQUALS`                   | Equal to                 |
| `ne`     | `!` `!=` `!==` | `NOT_EQUALS`               | Not equal to             |
| `gt`     | `>`            | `GREATER_THAN`             | Greater than             |
| `gte`    | `>=`           | `GREATER_THAN_OR_EQUAL_TO` | Greater than or equal to |
| `lt`     | `<`            | `LESS_THAN`                | Less than                |
| `lte`    | `<=`           | `LESS_THAN_OR_EQUAL_TO`    | Less than or equal to    |

When using filter expressions the operator can be represented either by its name (e.g. `eq`) or any of its aliases (e.g.
`==`). 

For example; the filter expression `">255"` will only match paths whose length is greater than 255 characters.

The API also allows `Filter` instances - which are also the result of parsing filter expressions - to be passed as the
`filter` option. This can be useful if your code will be calling `check` with the same filter multiple times as it can
avoid unnecessary parsing.

You can construct the `Filter` yourself or use `Filter.parse` to create an instance parsed from a filter expression:

``` javascript
const pathlength = require('pathlength');
const Filter = require('pathlength/src/api/Filter');
const Operator = require('pathlength/src/api/Operator');

// The following are equivalents
pathlength.check({ filter: new Filter(Operator.GREATER_THAN, 255) }).then((results) => ...);
pathlength.check({ filter: new Filter('>', 255) }).then((results) => ...);
pathlength.check({ filter: Filter.parse('>255') }).then((results) => ...);
pathlength.check({ filter: '>255' }).then((results) => ...);
```

## Bugs

If you have any problems with PathLength or would like to see changes currently in development you can do so
[here](https://github.com/neocotic/pathlength/issues).

## Contributors

If you want to contribute, you're a legend! Information on how you can do so can be found in
[CONTRIBUTING.md](https://github.com/neocotic/pathlength/blob/master/CONTRIBUTING.md). We want your suggestions and pull
requests!

A list of PathLength contributors can be found in
[AUTHORS.md](https://github.com/neocotic/pathlength/blob/master/AUTHORS.md).

## License

See [LICENSE.md](https://github.com/neocotic/pathlength/raw/master/LICENSE.md) for more information on our MIT license.
