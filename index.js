var events = require('events')
  , util = require('util')
  , path = require('path')
  , async = require('async')
  , read = require('./lib/read')
  , history = require('./lib/history')
  , utils = require('cli-util')
  , merge = utils.merge
  , native = require('cli-native');

var paused = new Error('paused');
paused.paused = true;

var types = {
  binary: 'binary',
  password: 'password'
}

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

  this.readline = read.open(this.rl);

  // no not store these in the options
  // to prevent cyclical reference on merge
  this.input = options.input;
  this.output = options.output;
  delete options.input;
  delete options.output;

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

  if(options.history) {
    this.history = options.history;
    delete options.history;
  }

  this.formats = options.formats || {};
  this.formats.default = this.formats.default || '(%s) ';

  this.name = options.name || path.basename(process.argv[1]);
  this.fmt = options.format ||
    ':name :delimiter :location :status :message :default';

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

Prompt.prototype.exec = function(options, cb) {
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
  read(opts, function(err, value, rl) {
    if(err) return cb(err);
    //console.log('got read value "%s" (%s)', value, typeof value);
    var val = (value || '').trim();

    //console.dir(options);
    //console.log('required %s', options.required);
    //console.log('repeat %s', options.repeat);
    //console.log('val "%s"', val);

    // required and repeat, prompt until we get a value
    if(!val && options.required && options.repeat) {
      return scope.exec(options, cb);
    }


    //if(options.type === types.password
      //&& options.equal && options.pass1 && !options.pass2) {
      //return scope.exec(options, cb);
    //}

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
    //

    if(options.history === false) {
      //console.log('removing last history item %j', rl.history);
      var last = rl.history.shift();
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
    if(opts.infinite && !scope._paused) {
      return scope.run(prompts, opts, cb);
    }
  })
}

function prompt(options) {
  return new Prompt(options);
}

var sets = require('./lib/sets');
var PromptDefinition = require('./lib/definition');

prompt.read = read;
prompt.errors = read.errors,
prompt.sets = sets;
prompt.PromptDefinition = PromptDefinition;
prompt.history = history;
prompt.History = history.History;
module.exports = prompt;


//var p = prompt({infinite: true});
//p.on('value', function(val, options) {
  ////console.dir(val);
  //console.dir(options);
  //if(val === 'passwd') {
    //p.pause();
    //p.run([sets.password[0]], function(err, result) {
      //p.resume();
    //})
  //}
//})
//p.run(null, function(er, result) {
  ////console.dir(result);
  ////process.exit();
//});
//
//var p = prompt({repeat: true});
//p.run(sets.userpass, function(er, result) {
  //console.dir(result);
  //process.exit();
//});

//var h = history({file: process.env.HOME + '/.rlx/.history', exit: true},
  //function(err, store, hs) {
    //if(err) return console.error(err);
    ////console.log('loaded history');
    ////console.dir(hs.getStore());
    ////

    //var p = prompt({infinite: true, history: store});
    //var res = store.mirror(p.readline, null, true);
    //p.on('cancel', function() {
      //process.exit();
    //})
    //p.on('value', function(val) {
      ////console.log('val: %s', val);
      //var histitem = store.interpret(val);
      //console.log('got interpreted history item %s', histitem);
      ////console.dir(p.readline);
      ////console.dir(p.readline.history);
      ////console.dir(store.history());
    //})
    ////console.log('start readline history: %s', p.readline.history);
    //p.run(function(err, result) {
      ////console.dir(p.rl.history);
      ////store.add([1,2,3], function() {
        //////console.log('added');
        //////console.dir(store.history());
        //////console.dir(store.history() === p.readline.history);
      ////})
      ////console.dir(result);
    //});
  //}
//);

//var p = prompt({repeat: true});
//p.run(sets.confirm, function(er, result) {
  //console.dir(result);
  //process.exit();
//});
/*
p.on('before', function(options, ps) {
})
p.on('value', function(value, options, ps) {
  console.log('value: \'%s\' (%s)', value, typeof value);
})
p.on('complete', function(options, ps) {
})
p.on('error', function(err) {
  if(!err.cancel) console.error('error: ' + err.message);
})
p.run(sets.userpass, function(err, result) {
  //if(err && !err.cancel) console.error('error: ' + err.message);
  //console.dir(result);
});
*/
