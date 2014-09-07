var events = require('events')
  , util = require('util')
  , async = require('async')
  , read = require('./read')
  , utils = require('cli-util')
  , merge = utils.merge
  , native = require('cli-native');

var Prompt = function(options) {
  options = options || {};
  options.prompt = options.prompt || '$ ';
  options.replace = options.replace || '*';
  options.native = options.native !== undefined ? options.native : {};
  this.options = options;
}

util.inherits(Prompt, events.EventEmitter);

Prompt.prototype.merge = function(options) {
  var o = merge(this.options, {});
  return merge(options, o, null, true);
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
    cb(null, value);
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
    if(err) return cb(err);
    scope.emit('complete', options, scope);
    cb(err, {list: result, map: map});
    if(options.infinite) {
      scope.run([scope.getDefaultPrompt()], cb);
    }
  })
}

function prompt(options) {
  return new Prompt(options);
}

module.exports = {
  read: read,
  prompt: prompt
}

var mock = [
  {
    key: 'name',
    message: 'enter name:'
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
p.run([], function(err, result) {
  //console.dir(result);
});
