var events = require('events')
  , util = require('util')
  , async = require('async')
  , read = require('./read')
  , utils = require('cli-util')
  , merge = utils.merge
  , native = require('cli-native');

var schema;
try{
  schema = require('async-validate');
}catch(e){}

var Prompt = function(options) {
  options = options || {};
  options.prompt = options.prompt || '$ ';
  options.replace = options.replace || '*';
  options.native = options.native !== undefined ? options.native : {};
  options.restore = options.restore !== undefined ? options.restore : true;
  options.rl = options.rl || {};
  options.rl.completer = options.rl.completer || options.completer;
  this.options = options;
}

util.inherits(Prompt, events.EventEmitter);

Prompt.prototype.merge = function(options) {
  console.dir(this.options);
  var rl = this.options.rl;
  delete this.options.rl;
  var o = merge(this.options, {});
  o = merge(options, o, null, true);
  o.rl = rl;
  return o;
}

Prompt.prototype.getDefaultPrompt = function() {
  return {
    key: 'default',
    prompt: this.options.prompt
  }
}

Prompt.prototype.exec = function(options, cb) {
  var scope = this;
  options = this.merge(options);
  this.emit('before', options, scope);
  read(options, function(err, value) {
    if(err) return cb(err);
    if(options.native) {
      value =
        native.to(value, options.native.delimiter, options.native.json);
    }

    scope.emit('after', value, options, scope);

    if(schema && options.schema && options.key) {
      console.log('validate');
      var source = {}, descriptor = {}
      source[options.key] = value;
      descriptor[options.key] = options.schema;
      console.dir(descriptor);
      var validator = new schema(descriptor);
      validator.validate(source, function(errors, fields) {
        console.log('validation response');
        if(errors && errors.length) {
          return cb(errors[0], value);
        }
        cb(null, value);
      });
    }else{
      cb(null, value);
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
    //console.dir(read);
    if(err && !options.infinite || err === read.errors.cancelled) return cb(err);
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

module.exports = {
  read: read,
  prompt: prompt,
  errors: read.errors
}

var mock = [
  {
    key: 'name',
    message: 'enter name:',
    schema: {type: 'boolean'}
  },
  {
    key: 'pass',
    message: 'enter password:',
    silent: true
  }
]

var p = prompt({infinite: true});
p.on('before', function(options, ps) {
})
p.on('after', function(value, options, ps) {
  console.log('value: %s (%s)', value, typeof value);
})
p.on('complete', function(options, ps) {
})
p.run(mock, function(err, result) {
  if(err && !err.cancel) console.error(err.message);
  //console.dir(result);
});
