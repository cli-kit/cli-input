var EOL = require('os').EOL
  , fs = require('fs')
  , assert = require('assert')
  , path = require('path')
  , touch = require('touch')
  , util = require('util')
  , events = require('events');

var stores = {};

function noop(){};

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
  this._stats = null;
}

HistoryStore.prototype.isFlushed = function() {
  return this._checkpoint === this._history.length;
}

HistoryStore.prototype._write = function(flush, cb) {
  var scope = this
    , contents = typeof flush === 'string' || flush instanceof Buffer
      ? flush : null;
  if(!flush || this._checkpoint === this._history.length) return cb(null, scope);
  //console.log('write to disc %s %s', this._checkpoint, this._history.length);
  var append = !contents;
  if(append) {
    contents = this.getLines();
  }

  function write(cb) {
    //console.log('writing contents...');
    this._stream.write(contents, function onwrite(err) {
      if(err) return cb(err, scope);
      fs.stat(scope.file, function(err, stats) {
        if(err) return cb(err, scope);
        stats.file = scope.file;
        scope._stats = stats;
        if(!err) scope._checkpoint = scope._history.length;
        //console.log('write complete %s', cb);
        return cb(err, scope);
      });
    });
  }
  //console.log('write to disc %j', append);
  if(!append) {
    this._stream.close();
    this._stream = fs.createWriteStream(this.file, {flags: 'w+'});
    write.call(scope, function(err) {
      if(err) return cb(err, scope);
      cb(null, scope);
    });
  }else{
    write.call(scope, cb);
  }
}

HistoryStore.prototype.getLines = function(checkpoint, length) {
  var lines = this._history.slice(
    checkpoint || this._checkpoint, length || this._history.length);
  // add trailing newline
  if(lines[lines.length - 1]) {
    lines.push('');
  }
  return lines.join(EOL);
}

HistoryStore.prototype.add = function(line, options, cb) {
  if(typeof options === 'function') {
    cb = options;
    options = null;
  }
  options = options || {};
  cb = typeof cb === 'function' ? cb : noop;
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
  this._write(flush, cb);
}

HistoryStore.prototype.pop = function(options, cb) {
  if(typeof options === 'function') {
    cb = options;
    options = null;
  }
  options = options || {};
  var scope = this
    , flush = options.flush || this.options.flush;
  var item = this._history.pop();
  var contents = this.getLines();
  var len = Buffer.byteLength(item + EOL);
  cb = typeof cb === 'function' ? cb : noop;
  if(!flush) {
    // not flushing to disc, so this acts more like peek()
    this._history.push(item);
    return cb(null, item, scope);
  }
  var length = this._stats.size - len;
  fs.ftruncate(this._stream.fd, length, function(err) {
    if(err) {
      // TODO: we need to re-initialize from the state on disc
    }else{
      scope._checkpoint = scope._history.length;
    }
    cb(err, item, scope);
  })
}

HistoryStore.prototype.clear = function(cb) {
  var scope = this;
  fs.writeFile(this.file, '', function(err) {
    if(err) return cb(err, scope);
    scope._history = [];
    scope._checkpoint = 0;
    cb(null, scope);
  })
}

HistoryStore.prototype.close = function(cb) {
  if(this._stream) {
    this._stream.once('finish', cb);
    this._stream.end();
    this._stream = null;
  }
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
  //console.log('loading %s', file);
  fs.readFile(file, function(err, contents) {
    if(err && err.code === 'ENOENT' && create) {
      return touch(file, function(err) {
        if(err) return cb(err, scope);
        scope.load(options, cb);
      });
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
  if(typeof options === 'function') {
    cb = options;
    options = null;
  }
  options = options || {};
  var h = new History(options);
  if(cb) {
    h.load(options, cb);
  }
  return h;
}

history.History = History;

module.exports = history;
