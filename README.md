Table of Contents
=================

* [Prompt](#prompt)
  * [Install](#install)
  * [Features](#features)
  * [Usage](#usage)
    * [Options](#options)
  * [Examples](#examples)
  * [Developer](#developer)
    * [Test](#test)
    * [Readme](#readme)

Prompt
======

Prompt and user input library, a component of the cli [toolkit](https://github.com/freeformsystems/cli-toolkit).

## Install

```
npm i cli-input --save
```

## Features

* ANSI escape sequences fully supported.
* Comprehensive history file support.
* Schema validation.
* Native type coercion.
* Collections of common prompt sets.
* Confirmation prompts (binary response).
* Silent prompts (passwords etc.)

## Usage

```javascript
var prompt = require('cli-input');
var ps = prompt({infinite: true});
ps.on('value', function(value, options, ps) {
  // do something with value
})
rs.run();
```

### Options

The `Prompt` class accepts the following options at instantiation:

* `input`: Input stream, default is `process.stdin`.
* `output`: Output stream, default is `process.stdout`.
* `prompt`: Default prompt string, defaults to `>`.
* `replace`: Replacement character for silent prompts, default is `*`.
* `infinite`: Whether the prompt should be displayed infinitely, default is `false`.
* `native`: Object that defines configuration for native type coercion, default is `null`.
* `restore`: When running in infinite mode and another set of prompts is executed, should the default infinite prompt be displayed at the end of the run, default is `true`.
* `repeat`: Repeat prompt on invalid input, default is `true`.
* `trim`: Remove leading and trailing whitespace from input lines, default is `false`.
* `split`: Split line into an array on the specified string or regexp, default is `null`.
* `delimiter`: Default value for the `:delimiter` format property, default is `⚡`.
* `name`: Default value for the `:name` format property, default is `path.basename(process.argv[1])`.
* `format`: Prompt format string specification, default is `:name :delimiter :location :status :message :default`.

## Examples

Examples are in the [example](https://github.com/freeformsystems/cli-input/blob/master/example) directory, execute an example with:

```
node example/repl.js
```

***Caution: the above example executes commands via the shell, be careful.***

## Developer

### Test

Run all tests with code coverage:

```
npm test
```

Execute an individual test with:

```
npm run pretest && NODE_ENV=test ./node_modules/.bin/mocha --reporter list ./test/spec/confirm.js
```

### Readme

To build the readme file from the partial definitions (requires [mdp](https://github.com/freeformsystems/mdp)):

```
npm run readme
```

Generated by [mdp(1)](https://github.com/freeformsystems/mdp).

[toolkit]: https://github.com/freeformsystems/cli-toolkit
[mdp]: https://github.com/freeformsystems/mdp
