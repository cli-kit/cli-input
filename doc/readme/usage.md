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

### prompt(options, cb)

Show a single prompt.

### run(prompts, cb)

Run an array of prompt definitions and invoke callback with the result. The result contains a `map` property which maps the definitions `key` to the input value.

### select(options, cb)

Display select menu output followed by a prompt.

### multiline(options, cb)

Capture multiline input.
