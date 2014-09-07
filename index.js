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

  // default prompt
  options.prompt = options.prompt || '$';

  // default replacment character for silent
  options.replace = options.replace || '*';

  // determine if a prompt should be re-displayed at the end of a run
  options.infinite = options.infinite !== undefined ? options.infinite : false;

  // convert to native types
  options.native = options.native !== undefined ? options.native : {};

  // when running in infinite mode, restore to default prompt at end of run
  options.restore = options.restore !== undefined ? options.restore : true;

  // when a validation error occurs repeat the last prompt
  // until we get a valid value
  options.repeat = options.repeat !== undefined ? options.repeat : true;

  // trim leading and trailing whitespace from input lines
  options.trim = options.trim !== undefined ? options.trim : false;

  options.delimiter = options.delimiter || '⚡';

  this.formats = options.formats || {};
  this.formats.default = this.formats.defaults || '(%s)';

  this.name = options.name || path.basename(process.argv[1]);
  this.fmt = options.format ||
    ':name :delimiter :message :default'

  this.options = options;
}

util.inherits(Prompt, events.EventEmitter);

Prompt.prototype.transform = function(k, v, options) {
  if(this.formats[k] && v) {
    v = util.format(this.formats[k], v);
  }
  return v;
}

Prompt.prototype.replace = function(format, source, options) {
  var s = '' + format, k, v;
  for(k in source) {
    v = source[k];
    v = this.transform(k, v, options);
    s = s.replace(new RegExp(':' + k, 'gi'), v ? v : '');
  }
  s = s.replace(/ +/g, ' ');
  return s;
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
  var o = merge(this.options, {});
  o = merge(options, o, null, true);
  if(typeof this.options.prompt === 'function') {
    o.prompt = this.options.prompt(options, o, this);
  }else{
    o.prompt = this.format(o);
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

Prompt.prototype.run = function(prompts, cb) {
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
    //console.dir(result);
    //console.dir(err);
    //console.log('inf: %s', options.infinite);
    if(err && err.cancel) return scope.emit('cancel', prompts, scope);
    if(err && err.timeout) return scope.emit('timeout', prompts, scope);
    if(err) {
      scope.emit('error', prompts, scope);
    }
    scope.emit('complete', options, scope);
    cb(err, {list: result, map: map});
    if(options.infinite) {
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
