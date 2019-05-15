# replace-html-script

[![Build Status via Travis CI](https://travis-ci.org/xhronos/replace-html-script.svg?branch=master)](https://travis-ci.org/xhronos/replace-html-script)

Replaces the script tag in html files with the content of a script-file.
Works also on html-imports which are not well formed html documents since they
are missing the surrounding `<html>`, `<head>` / `<body>` tags.

There are two possible usages:
* as tool, e.g. for incorporating into a build process
* as node.js module


## Install

*install as globally installed tool*

```bash
npm install -g replace-html-script
```

*install to local node_modules folder*

```bash
npm install --save replace-html-script
```

## Usage

### command line

#### using pipes

```bash
cat input.html | replace-html-script -s scriptfile.js > output.html
```

### using file parameters

```bash
replace-html-script -s scriptfile.js -i input.html -o output.html
```

### node.js module

The `input` and `script` parameters can be either a filename or a ReadableStream.
The `output` parameter can also be either a filename or a WritableStream.

#### using filenames

```javascript
const { replaceScript } = require('replace-html-script');

const input = 'input.html';
const output = 'input.html';
const script = 'scriptfile.js';

replaceScript({input, output, script})
.then(()=>console.log("done"));
```

#### using streams

```javascript
const { replaceScript } = require('replace-html-script');
const fs = require('fs');

const input = fs.createReadStream('input.html');
const output = fs.createWriteStream('input.html');
const script = fs.createReadStream('scriptfile.js');

replaceScript({input, output, script})
.then(()=>console.log("done"));
```
