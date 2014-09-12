var EOL = require('os').EOL
  , events = require('events')
  , util = require('util')
  , path = require('path')
  , async = require('async')
  , utils = require('cli-util')
  , merge = utils.merge
  , native = require('cli-native')
  , read = require('./lib/read')
  , history = require('./lib/history')
  , sets = require('./lib/sets')
  , definitions = sets.definitions
  , PromptDefinition = require('./lib/definition');

var schema;
try{
  schema = require('async-validate');
}catch(e){}

var types = {
  binary: 'binary',
  password: 'password'
}

var Prompt = function(options, rl) {
  options = options || {};

  this.rl = rl || {};
  this.rl.completer = this.rl.completer || options.completer;
  this.rl.input = options.input || process.stdin;
  this.rl.output = options.output || process.stdout;
  this.rl.terminal = !!(options.terminal || this.rl.output.isTTY);

  this.readline = read.open(this.rl);

  // no not store these in the options
  // to prevent cyclical reference on merge
  this.input = options.input || this.rl.input;
  this.output = options.output || this.rl.output;
  delete options.input;
  delete options.output;

  this.formats = options.formats || {};

  // format for default values
  this.formats.default = this.formats.default || '(%s) ';

  // format for select options
  this.formats.option = this.formats.select || '%s) %s';

  this.name = options.name || path.basename(process.argv[1]);
  this.fmt = options.format ||
    ':name :delimiter :location :status :message :default';

  // default prompt
  options.prompt = options.prompt || '>';

  // default replacement character for silent
  options.replace = options.replace || '*';

  // determine if a prompt should be re-displayed at the end of a run
  options.infinite = options.infinite !== undefined ? options.infinite : false;

  // convert to native types
  options.native = options.native !== undefined ? options.native : null;

  // when running in infinite mode, restore to default prompt at end of run
  options.restore = options.restore !== undefined ? options.restore : true;

  // when a validation error occurs repeat the last prompt
  // until we get a valid value
  options.repeat = options.repeat !== undefined ? options.repeat : true;

  // trim leading and trailing whitespace from input lines
  options.trim = options.trim !== undefined ? options.trim : false;

  // split values into array
  options.split = options.split !== undefined ? options.split : null;

  // delimiter that comes after the name
  options.delimiter = options.delimiter || '⚡';

  // color callback functions
  options.colors = options.colors || {};

  // history has cyclical references
  if(options.history) {
    this.history = options.history;
    delete options.history;
  }

  this.keys = this.fmt.split(' ').map(function(value) {
    return value.replace(/^:/, '');
  })

  this.options = options;
  this._use = {};
}

util.inherits(Prompt, events.EventEmitter);

Prompt.prototype.use = function(props) {
  this._use = merge(props, this._use);
}

Prompt.prototype.transform = function(k, v, options) {
  var fmts = merge(this.formats, {}, {copy: true});
  fmts = merge(options.formats || {}, fmts, {copy: true});
  if(fmts[k] && v) {
    v = util.format(fmts[k], v);
  }
  return v;
}

Prompt.prototype.replace = function(format, source, options) {
  var s = '' + format, k, v;
  var items = {}, keys = this.keys;
  function clean(s) {
    // strip extraneous keys
    for(var i = 0;i < keys.length;i++) {
      s = s.replace(new RegExp(':' + keys[i], 'g'), '');
    }
    // strip multiple whitespace
    s = s.replace(/ +/g, ' ');
    return s;
  }

  var highlights = this.rl.output
    && this.rl.output.isTTY && this._use.colors !== false;
  var prefixed = this.options.colors && this.options.colors.prefix;
  var name = source.name
    , delimiter = source.delimiter;

  if(prefixed) {
    if(highlights) {
      prefixed = this.options.colors.prefix(name, delimiter);
    }
    delete source.name;
    delete source.delimiter;
  }

  var replaces = false;

  for(k in source) {
    v = source[k];
    if(typeof v === 'function') {
      v = v(k, options);
    }
    replaces = Array.isArray(options.parameters) && k === 'message';
    // store them for processing later
    items[k] = {k: k, v: v}

    // parameter replacment
    if(replaces) {
      items[k].v = util.format(v, options.parameters);
      if(highlights && typeof this.options.colors.parameters === 'function') {
        items[k].c =
          util.format(v, this.options.colors.parameters(options.parameters));
      }
    }

    // get colorized values
    if(highlights
      && typeof this.options.colors[k] === 'function' && !replaces) {
      items[k].c = this.options.colors[k](v);
    }
  }

  // build up plain string so we can get the length
  var raw = '' + format;
  for(k in items) {
    v = items[k].v;
    v = this.transform(k, v, options);
    raw = raw.replace(new RegExp(':' + k, 'gi'), v ? v : '');
  }
  raw = clean(raw);

  // now build up a colorized version
  s = '' + format;
  for(k in items) {
    v = items[k].c || items[k].v;
    v = this.transform(k, v, options);
    s = s.replace(new RegExp(':' + k, 'gi'), v ? v : '');
  }
  s = clean(s);

  if(prefixed && prefixed.value && prefixed.color) {
    raw = prefixed.value + raw;
    s = prefixed.color + s;
  }

  return {prompt: s, raw: raw};
}

Prompt.prototype.format = function(options) {
  var source = options.data || {};
  source.name = source.name || this.name;
  source.date = new Date();
  source.message = options.message;
  source.delimiter = options.delimiter;
  source.default = options.default;
  return this.replace(options.format || this.fmt, source, options);
}

Prompt.prototype.merge = function(options) {
  var o = merge(this.options, {}, {copy: true}), fmt;
  o = merge(options, o, {copy: true});
  if(typeof this.options.prompt === 'function') {
    o.prompt = this.options.prompt(options, o, this);
  }else{
    fmt = this.format(o);
    o.raw = fmt.raw;
    // plain prompt length with no color (ANSI)
    // store string length so we can workaround
    // #3860, fix available from 0.11.3 node
    o.length = fmt.raw.length;
    o.prompt = fmt.prompt;
  }
  if(o.silent && !o.replace) {
    o.replace = this.options.replace;
  }
  return o;
}

Prompt.prototype.getDefaultPrompt = function() {
  return {
    key: 'default',
    prompt: this.options.prompt
  }
}

Prompt.prototype.pause = function() {
  this._paused = true;
  this.emit('pause', this);
}

Prompt.prototype.resume = function(options, cb) {
  if(!this._paused) return;
  var scope = this;
  this._paused = false;
  options = options || {};
  if(options.infinite || this.options.infinite) {
    this.exec(options || this.getDefaultPrompt(), cb);
  }
  this.emit('resume', this);
}

Prompt.prototype.prompt = function(options, cb) {
  this.exec(options, cb);
}

Prompt.prototype.run = function(prompts, opts, cb) {
  if(typeof prompts === 'function') {
    cb = prompts;
    prompts = null;
  }
  if(typeof opts === 'function') {
    cb = opts;
    opts = null;
  }
  cb = typeof cb === 'function' ? cb : function noop(){};
  opts = opts || {};
  var scope = this, options = this.options;
  prompts = prompts || [scope.getDefaultPrompt()];
  var map = {};
  async.concatSeries(prompts, function(item, callback) {
    scope.exec(item, function(err, result) {
      if(item.key) {
        map[item.key] = result;
      }
      callback(err, result);
    });
  }, function(err, result) {
    if(err && err.cancel) return scope.emit('cancel', prompts, scope);
    if(err && err.timeout) return scope.emit('timeout', prompts, scope);
    if(err && err.paused) return scope.emit('paused', prompts, scope);
    if(err) {
      scope.emit('error', prompts, scope);
    }
    var res = {list: result, map: map};
    scope.emit('complete', res);
    cb(null, res);
    if((opts.infinite || scope.options.infinite) && !scope._paused) {
      return scope.run(prompts, opts, cb);
    }
  })
}

/**
 *  Default implementation for formatting option values.
 */
Prompt.prototype.option = function(index, value) {
  return util.format(this.formats.option, index + 1, value);
}

/**
 *  Select from a list of options.
 *
 *  Display numbers are 1 based.
 */
Prompt.prototype.select = function(options, cb) {
  if(typeof options === 'function') {
    cb = options;
    options = null;
  }
  options = options || {};
  var scope = this, i, s, map = [];
  var output = options.output || this.output;
  var list = options.list || [];
  var validate = options.validate !== undefined
    ? options.validate : true;
  var formatter = typeof options.formatter === 'function'
    ? options.formatter : this.option.bind(this);
  var prompt = options.prompt || definitions.option.clone();
  for(i = 0;i < list.length;i++) {
    s = formatter(i, list[i]);
    map.push({display: i + 1, index: i, value: list[i]});
    output.write(s + EOL);
  }
  function show() {
    scope.exec(prompt, function(err, res) {
      if(err) return cb(err);
      var int = parseInt(res)
        , val = !isNaN(int) ? map[--int] : null
        , invalid = isNaN(int) || !val;
      if(validate && invalid) {
        scope.emit('invalid', res, int, options, scope);
      }
      if(options.repeat || prompt.repeat && (validate && invalid)) {
        return show();
      }
      if(!invalid) cb(err, val, int, res);
    });
  }
  show();
}

/**
 *  Collect multiline into a string.
 */
Prompt.prototype.multiline = function(options, cb, lines) {
  if(typeof options === 'function') {
    cb = options;
    options = null;
  }
  options = options || {};
  lines = lines || '';

  var scope = this
    , input = this.input
    , output = this.output
    , key = options.key || '\u0004'
    , newline = options.newline !== undefined ? options.newline : true
    , prompt = options.prompt || {blank: true};

  function onkeypress(c, props) {
    if(c === key) {
      input.removeListener('keypress', onkeypress);
      if(newline) {
        output.write(EOL);
      }
      if(options.json) {
        try {
          console.dir(lines);
          lines = JSON.parse(lines);
        }catch(e) {
          return cb(e, lines);
        }
      }
      return cb(null, lines);
    }
    lines += c;
  }

  input.on('keypress', onkeypress);

  prompt.expand = false;

  scope.exec(prompt, function(err, line) {
    input.removeListener('keypress', onkeypress);
    if(err) return cb(err);
    lines += EOL;
    scope.multiline(options, cb, lines);
  });
}

/**
 *  @private
 */
Prompt.prototype.exec = function(options, cb) {
  if(typeof options === 'function') {
    cb = options;
    options = null;
  }
  options = options || {};
  options = this.merge(options);
  cb = typeof cb === 'function' ? cb : function noop(){};
  var scope = this;
  var opts = {}, k;
  var trim = options.trim;
  for(k in options) opts[k] = options[k];
  opts.rl = this.rl;
  opts.emitter = this;
  this.emit('before', opts, options, scope);
  if(options.blank) {
    opts.prompt = '';
    opts.length = 0;
  }
  read(opts, function(err, value, rl) {
    if(err) return cb(err);
    //console.log('got read value "%s" (%s)', value, typeof value);
    var val = (value || '').trim();

    if(!val) {
      scope.emit('empty', options, scope);
    }

    // required and repeat, prompt until we get a value
    if(!val && options.required && options.repeat) {
      return scope.exec(options, cb);
    }

    if(options.native && val) {
      val =
        native.to(val, options.native.delimiter, options.native.json);
    }

    if(!trim && typeof val === 'string') {
      val = value;
    }

    if((typeof options.split === 'string' || options.split instanceof RegExp)
      && val && typeof val === 'string') {
      val = val.split(options.split);
      val = val.filter(function(part) {
        return part;
      });
    }

    //console.log('emitting value %j', options.key);
    //console.log('emitting value %s', cb);

    if(options.history === false) {
      rl.history.shift();
    }

    if(options.type === types.binary) {
      var accept = options.accept
        , reject = options.reject;
      if(accept.test(val)) {
        val = {result: val, accept: true}
        scope.emit('accepted', val, scope);
      }else if(reject.test(val)) {
        val = {result: val, accept: false}
        scope.emit('rejected', val, scope);
      }else{
        val = {result: val, accept: null}
        scope.emit('unacceptable', val, options, scope);
        if(options.repeat) return scope.exec(options, cb);
      }
    }

    if(options.type === types.password && options.equal) {
      if(!options.pass1) {
        options.pass1 = val;
        options.default = options.confirmation;
        // gather password confirmation
        return scope.exec(options, cb);
      }else{
        options.pass2 = val;
        if(options.pass1 !== options.pass2) {
          scope.emit('mismatch',
            options.pass1, options.pass2, options, scope);
          delete options.pass1;
          delete options.pass2;
          delete options.default;
          return scope.exec(options, cb);
        }
      }
    }

    if(options.type === undefined) {
      // convert to command array for items with no type
      if(typeof val === 'string' && options.expand !== false) {
        val = val.split(/\s+/);
      }
      scope.emit('value', val, options, scope);
    }else{
      scope.emit(options.type, val, options, scope);
    }

    if(schema && options.schema && options.key) {
      var source = {}, descriptor = {}
      source[options.key] = value;
      descriptor[options.key] = options.schema;
      var validator = new schema(descriptor);
      validator.validate(source, function(errors, fields) {
        if(errors && errors.length) {
          if(options.repeat) {
            scope.emit('error', errors[0], options, cb);
            return scope.exec(options, cb);
          }
          return cb(errors[0], value);
        }
        cb(null, val);
      });
    }else{
      cb(null, val);
    }
  });
}


function prompt(options) {
  return new Prompt(options);
}

prompt.read = read;
prompt.errors = read.errors,
prompt.sets = sets;
prompt.PromptDefinition = PromptDefinition;
prompt.history = history;
prompt.History = history.History;
prompt.HistoryFile = history.HistoryFile;
module.exports = prompt;
