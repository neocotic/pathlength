                    __    __      ___                          __    __         
                   /\ \__/\ \    /\_ \                        /\ \__/\ \        
     _____     __  \ \ ,_\ \ \___\//\ \      __    ___      __\ \ ,_\ \ \___    
    /\ '__`\ /'__`\ \ \ \/\ \  _ `\\ \ \   /'__`\/' _ `\  /'_ `\ \ \/\ \  _ `\  
    \ \ \L\ \\ \L\.\_\ \ \_\ \ \ \ \\_\ \_/\  __//\ \/\ \/\ \L\ \ \ \_\ \ \ \ \ 
     \ \ ,__/ \__/.\_\\ \__\\ \_\ \_\\____\ \____\ \_\ \_\ \____ \ \__\\ \_\ \_\
      \ \ \/ \/__/\/_/ \/__/ \/_/\/_//____/\/____/\/_/\/_/\/___L\ \/__/ \/_/\/_/
       \ \_\                                                /\____/             
        \/_/                                                \_/__/              

[pathlength][] is a simple file path length checker for [Node.js][].

## Installation

Install from [npm][]:

``` bash
$ npm install pathlength
```

## Usage

    Usage: pathlength [options] [target]

    Options:

      -h, --help                 output usage information
      -V, --version              output the version number
      -d, --debug                output debug messages
      -f, --filter [expression]  filter expression to use
      -n, --no-headers           don't output headers for certain formats
      -o, --output [format]      format for output
      -p, --progressive          output matches as they are found
      -r, --recursive            check directories recursively
      -s, --stop                 don't search unfiltered directories

### Examples

Recursively check for all files within a `Temp` directory with a path longer
than 255 characters:

``` bash
$ pathlength -rf ">255" ~/Temp
```

Check for paths length longer than that of the target file/directory:

``` bash
$ pathlength -rf ">@" ~/Temp
```

Format the result output as a padded table with headers:

``` bash
$ pathlength -ro table -f ">@" ~/Temp
```

Output:

    Path                             Length Type      
    /Users/neocotic/Temp/bar.txt     28     File      
    /Users/neocotic/Temp/foo.txt     28     File      
    /Users/neocotic/Temp/sub         24     Directory 
    /Users/neocotic/Temp/sub/baz.txt 32     File      
    /Users/neocotic/Temp/sub/fu.txt  31     File      

Output the results of the search as they are found:

``` bash
$ pathlength -rpf ">@" ~/Temp
```

## Formats

``` bash
$ pathlength -o $FORMAT ~/Temp
```

### Simple (default)

Names: `simple` `s`

Example:

    /Users/neocotic/Temp:20

### Comma-separated values

Names: `csv` `c`

Example:

    "/Users/neocotic/Temp","20","Directory"

### JSON

Names: `json` `j`

Example:

``` javascript
[
  {
    "path": "/Users/neocotic/Temp",
    "length": 20,
    "type": "Directory"
  }
]
```

### Table

Names: `table` `t`

Notes:

* Includes headers unless the `-n|--no-headers` option is used
* Columns are not padding when running in progressive mode

Example:

    Path                 Length Type
    /Users/neocotic/Temp 20     Directory

### XML

Names: `xml` `x`

Example:

``` xml
<?xml version="1.0" encoding="UTF-8" ?>
<results>
  <result path="/Users/neocotic/Temp" length="20" type="Directory" />
</results>
```

## Programmatically

`find([options][, callback])` is used primarily:

``` javascript
var pathlength = require('pathlength')

pathlength.find({
        filter: ['lte', '255']
      , recursive: true
      , target: '~/Temp'
    }
  , function(err, dataSet) {
      if (err) throw err
      // Process data set...
    })
```

### Options

The following options are recognised by this method (all of which are
optional);

<table>
  <tr>
    <th>Property</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>context</td>
    <td>Context in which to call the callback function</td>
  </tr>
  <tr>
    <td>filter</td>
    <td>Filter expression used to check files/directories</td>
  </tr>
  <tr>
    <td>recursive</td>
    <td>Check directories recursively</td>
  </tr>
  <tr>
    <td>stop</td>
    <td>Don't check children of unfiltered directories</td>
  </tr>
  <tr>
    <td>target</td>
    <td>Target file/directory to check</td>
  </tr>
</table>

### Events

Get notified whenever a matching file/directory has been found:

``` javascript
var pathlength = require('pathlength')

pathlength.on('data', function(e, data) {
  console.log('Event: %j', e.type) // Event: "data"
  // Process data...
})
pathlength.find({
    filter: 'gt @'
  , recursive: true
  , target: '~/Temp'
})
```

The following events can be triggered by this method;

<table>
  <tr>
    <th>Name</th>
    <th>Called...</th>
  </tr>
  <tr>
    <td>start</td>
    <td>...after handling all arguments</td>
  </tr>
  <tr>
    <td>afterStart</td>
    <td>...before the first <em>beforeData</em> event</td>
  </tr>
  <tr>
    <td>betweenData</td>
    <td>...before all other <em>beforeData</em> events</td>
  </tr>
  <tr>
    <td>beforeData</td>
    <td>...before all <em>data</em> events (<code>data</code> argument passed to handlers)</td>
  </tr>
  <tr>
    <td>data</td>
    <td>...when the result has been stored in the data set (<code>data</code> argument passed to handlers)</td>
  </tr>
  <tr>
    <td>afterData</td>
    <td>...after all <em>data</em> events (<code>data</code> argument passed to handlers)</td>
  </tr>
  <tr>
    <td>beforeEnd</td>
    <td>...after the last <em>afterData</em> event (<code>dataSet</code> argument passed to handlers)</td>
  </tr>
  <tr>
    <td>end</td>
    <td>...in parallel with the callback function (<code>dataSet</code> argument passed to handlers)</td>
  </tr>
</table>

### Properties

``` javascript
pathlength.on('end', function(e, dataSet) {
  dataSet.forEach(function(data) {
    console.log(data.path)      // e.g. /Users/neocotic/Temp
    console.log(data.length)    // e.g. 20
    console.log(data.directory) // e.g. true
    console.log('')
  })
})
```

## Filters

Filters simply consist of a comparison operator followed by an operand.

A wildcard (`*`) character replaces any invalid filter component(s), which will
result in all files and directories being included in the results.

<table>
  <tr>
    <th>Operators</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>
      <code>!</code>
      <code>!=</code>
      <code>ne</code>
    </td>
    <td>Not equal to</td>
  </tr>
  <tr>
    <td>
      <code>=</code>
      <code>==</code>
      <code>eq</code>
    </td>
    <td>Equal to</td>
  </tr>
  <tr>
    <td>
      <code>&gt;</code>
      <code>gt</code>
    </td>
    <td>Greater than</td>
  </tr>
  <tr>
    <td>
      <code>&gt;=</code>
      <code>gte</code>
    </td>
    <td>Greater than or equal to</td>
  </tr>
  <tr>
    <td>
      <code>&lt;</code>
      <code>lt</code>
    </td>
    <td>Less than</td>
  </tr>
  <tr>
    <td>
      <code>&lt;=</code>
      <code>lte</code>
    </td>
    <td>Less than or equal to</td>
  </tr>
</table>

Operands can consist of numeric characters or one of the following special
characters, which are replaced with their corresponding value:

<table>
  <tr>
    <th>Character</th>
    <th>Value</th>
  </tr>
  <tr>
    <td><code>@</code></td>
    <td>Length of the target file/directory</td>
  </tr>
</table>

## Bugs

If you have any problems with this library or would like to see the changes
currently in development you can do so here;

https://github.com/neocotic/pathlength/issues

## Questions?

Take a look at `docs/index.html` to get a better understanding of what the code
is doing.

If that doesn't help, feel free to follow me on Twitter, [@neocotic][].

However, if you want more information or examples of using this library please
visit the project's homepage;

http://neocotic.com/pathlength

[@neocotic]: https://twitter.com/neocotic
[node.js]: http://nodejs.org
[npm]: http://npmjs.org
[pathlength]: http://neocotic.com/pathlength