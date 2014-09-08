var events = require('events')
  , util = require('util')
  , path = require('path')
  , async = require('async')
  , read = require('./read')
  , utils = require('cli-util')
  , merge = utils.merge
  , native = require('cli-native');

var schema;
try{
  schema = require('async-validate');
}catch(e){}

var Prompt = function(options, rl) {
  options = options || {};

  this.rl = rl || {};
  this.rl.completer = this.rl.completer || options.completer;
  this.rl.input = options.input || process.stdin;
  this.rl.output = options.output || process.stdout;
  this.rl.terminal = !!(options.terminal || this.rl.output.isTTY);

  // default prompt
  options.prompt = options.prompt || '>';

  // default replacment character for silent
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

  options.delimiter = options.delimiter || '⚡';

  // color callback functions
  options.colors = options.colors || {};

  this.formats = options.formats || {};
  this.formats.default = this.formats.default || '(%s) ';

  this.name = options.name || path.basename(process.argv[1]);
  this.fmt = options.format ||
    ':name :delimiter :location :status :message :default';

  this.keys = this.fmt.split(' ').map(function(value) {
    return value.replace(/^:/, '');
  })

  this.options = options;
}

util.inherits(Prompt, events.EventEmitter);

Prompt.prototype.transform = function(k, v, options) {
  var fmts = merge(this.formats, {});
  fmts = merge(options.formats || {}, fmts);
  //console.dir(fmts);
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

  var highlights = this.rl.output && this.rl.output.isTTY;
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

  for(k in source) {
    v = source[k];
    if(typeof v === 'function') {
      v = v(k, options);
    }
    // get replacement values
    //v = this.transform(k, v, options);
    // store them for processing later
    items[k] = {k: k, v: v}
    // get colorized values
    if(highlights
      && typeof this.options.colors[k] === 'function') {
      //console.log('colorize on %s', k);
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
  var o = merge(this.options, {}), fmt;
  o = merge(options, o, null, true);
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
  return o;
}

Prompt.prototype.getDefaultPrompt = function() {
  return {
    key: 'default',
    prompt: this.options.prompt
  }
}

Prompt.prototype.exec = function(options, cb) {
  options = this.merge(options);
  var scope = this;
  var opts = {}, k;
  var trim = options.trim;
  for(k in options) opts[k] = options[k];
  opts.rl = this.rl;
  this.emit('before', options, scope);
  //console.dir(opts);
  read(opts, function(err, value) {
    if(err) return cb(err);
    var val = (value || '').trim();
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

    scope.emit('value', val, options, scope);

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

Prompt.prototype.pause = function() {
  this._paused = true;
}

Prompt.prototype.resume = function(prompts, cb) {
  this._paused = false;
  if(this.options.infinite) {
    this.run(prompts, cb);
  }
}

Prompt.prototype.run = function(prompts, cb) {
  cb = cb || function(){};
  var scope = this, options = this.options;
  prompts = prompts || [];
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
    if(err) {
      scope.emit('error', prompts, scope);
    }
    scope.emit('complete', options, scope);
    cb(err, {list: result, map: map});
    if(options.infinite && !scope._paused) {
      scope.run(options.restore ? [scope.getDefaultPrompt()] : prompts, cb);
    }
  })
}

function prompt(options) {
  return new Prompt(options);
}

var sets = require('./sets');

prompt.read = read;
prompt.errors = read.errors,
prompt.sets = sets;
module.exports = prompt;

//module.exports = {
  //read: read,
  //prompt: prompt,
  //errors: read.errors,
  //sets: sets
//}

//var p = prompt({infinite: true});
//p.on('before', function(options, ps) {
//})
//p.on('value', function(value, options, ps) {
  //console.log('value: \'%s\' (%s)', value, typeof value);
//})
//p.on('complete', function(options, ps) {
//})
//p.on('error', function(err) {
  //if(!err.cancel) console.error('error: ' + err.message);
//})
//p.run(sets.userpass, function(err, result) {
  ////if(err && !err.cancel) console.error('error: ' + err.message);
  ////console.dir(result);
//});
