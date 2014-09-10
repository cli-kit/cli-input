var EOL = require('os').EOL
  , fs = require('fs')
  , assert = require('assert')
  , path = require('path')
  , util = require('util')
  , events = require('events');

var stores = {};

var HistoryStore = function(parent, options, lines) {
  options = options || {};
  lines = lines.split('\n');
  lines = lines.filter(function(line) {
    line = line.replace(/\r$/, '');
    line = line.trim();
    return line;
  })
  options.flush = options.flush !== undefined ? options.flush : true;
  options.duplicates = options.duplicates !== undefined
    ? options.duplicates : false;
  options.limit = options.limit === 'number' ? options.limit : 2048;
  this.file = options.file;
  this.options = options;
  this._parent = parent;
  this._history = lines;
  this._checkpoint = this._history.length;
  this._stream = fs.createWriteStream(this.file, {flags: 'a+'});
}

HistoryStore.prototype.isFlushed = function() {
  return this._checkpoint === this._history.length;
}

HistoryStore.prototype.write = function(flush, cb) {
  var scope = this;
  if(!flush || this._checkpoint === this._history.length) return cb(null, scope);
  //console.log('write to disc %s %s', this._checkpoint, this._history.length);
  var lines = this._history.slice(this._checkpoint, this._history.length);
  // add trailing newline
  if(lines[lines.length - 1]) {
    lines.push('');
  }
  var append = lines.join(EOL);
  //console.log('write to disc %j', append);
  this._stream.write(append, function(err) {
    if(!err) scope._checkpoint = scope._history.length;
    return cb(err, scope);
  });

}

HistoryStore.prototype.add = function(line, options, cb) {
  if(typeof options === 'function') {
    cb = options;
    options = null;
  }
  cb = typeof cb === 'function' ? cb : function noop(){};
  options = options || {};
  var scope = this
    , flush = options.flush || this.options.flush;
  if(!this.options.duplicates && ~this._history.indexOf(line)) {
    return cb(null, scope);
  }
  //console.log('flush %s', flush);
  assert(typeof line === 'string', 'history entry must be a string')
  line = '' + line;
  line = line.replace(/\r?\n$/, '');
  this._history.push(line);
  this.write(flush, cb);
}

//HistoryStore.prototype.close = function

HistoryStore.prototype.clear = function(cb) {
  var scope = this;
  fs.writeFile(this.file, '', function(err) {
    if(err) return cb(err, scope);
    scope._history = [];
    scope._checkpoint = 0;
    cb(null, scope);
  })
}

var History = function(options) {
  options = options || {};
  options.create = options.create !== undefined ? options.create : true;
  this.options = options;
}

util.inherits(History, events.EventEmitter);

History.prototype.load = function(options, cb) {
  var scope = this;
  if(typeof options === 'function') {
    cb = options;
    options = null;
  }
  options = options || {};
  var file = options.file || this.options.file
    , create = options.create !== undefined
      ? options.create : this.options.create;
  assert(file, 'cannot load history with no file');
  file = path.normalize(file);
  if(stores[file] && !options.force) {
    return cb(null, stores[file]);
  }
  function touch() {
    var st = fs.createWriteStream(file, function(err) {
      if(err) return cb(err, null, scope);
      st.end();
      st.destroy();
      load(options, cb);
    });
  }
  fs.readFile(file, function(err, contents) {
    if(err && err.code === 'ENOENT' && create) {
      return touch();
    }
    if(err) return cb(err, null, scope);
    var store = new HistoryStore(scope, scope.options, '' + contents);
    stores[file] = store;
    cb(null, store, scope);
  })
}

/**
 *  Get a history store by file path or all stores.
 */
History.prototype.getStore = function(file) {
  if(file) return stores[file];
  return stores;
}

function history(options, cb) {
  var h = new History(options);
  if(cb) {
    h.load(options, cb);
  }
  return h;
}

history.History = History;

module.exports = history;
