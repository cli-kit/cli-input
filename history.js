var EOL = require('os').EOL
  , fs = require('fs')
  , assert = require('assert')
  , path = require('path')
  , touch = require('touch')
  , util = require('util')
  , events = require('events')
  , utils = require('cli-util')
  , uniq = utils.uniq
  , merge = utils.merge;

var stores = {};

function noop(){};

var HistoryStore = function(parent, options, lines) {
  var scope = this;

  options = options || {};
  lines = this.readLines(lines);
  options.flush = options.flush !== undefined ? options.flush : true;
  options.duplicates = options.duplicates !== undefined
    ? options.duplicates : false;
  options.limit = options.limit === 'number' ? options.limit : 2048;

  // flush on process close
  if(options.close) {
    // don't flush on modification
    options.flush = false;
    process.on('exit', function() {
      console.log('flush on exit');
      fs.writeFileSync(scope.file, scope.getLines());
    })
  }

  this.file = options.file;
  this.options = options;
  this._parent = parent;
  this._history = lines;
  this._stream = fs.createWriteStream(this.file, {flags: 'a+'});
  this._stats = null;
  this.reset();
  this._success();
}

HistoryStore.prototype.position = function(index) {
  return this._position;
}

HistoryStore.prototype.go = function(index) {
  if(index > -1 && index < this._history.length) {
    this._position = index;
    return this._history[index];
  }
  return false;
}

HistoryStore.prototype.next = function() {
  var pos = this._position + 1;
  if(pos < this._history.length) {
    this._position = pos;
    return this._history[pos];
  }
  return false;
}

HistoryStore.prototype.previous = function() {
  var pos = this._position - 1;
  if(pos > -1 && this._history.length) {
    this._position = pos;
    return this._history[pos];
  }
  return false;
}

HistoryStore.prototype.reset = function() {
  if(!this._history.length) {
    this._position = 0;
  }else{
    this._position = this._history.length - 1;
  }
  return this._position;
}

/**
 *  Get the underlying history array.
 */
HistoryStore.prototype.history = function() {
  return this._history;
}

/**
 *  Get the underlying file stats.
 */
HistoryStore.prototype.stats = function(cb) {
  var scope = this;
  if(typeof cb === 'function') {
    fs.stat(this.file, function(err, stats) {
      if(err) return cb(err, scope);
      stats.file = scope.file;
      scope._stats = stats;
      return cb(err, scope);
    });
  }
  return this._stats;
}

/**
 *  Get the parent History instance.
 */
HistoryStore.prototype.parent = function() {
  return this._parent;
}

/**
 *  Read lines into an array.
 *
 *  @param lines A string or buffer.
 *
 *  @return An array of lines.
 */
HistoryStore.prototype.readLines = function(lines) {
  if(!lines) return [];
  if(lines instanceof Buffer) lines = '' + lines;
  if(typeof lines === 'string') {
    lines = lines.split('\n');
    lines = lines.filter(function(line) {
      line = line.replace(/\r$/, '');
      line = line.trim();
      return line;
    })
  }
  if(!this.options.duplicates) {
    lines = uniq(lines);
  }
  lines = this._filter(lines);
  if(lines.length > this.options.limit) {
    lines = lines.slice(lines.length - this.options.limit);
  }
  return lines;
}

/**
 *  Get a string of lines from the underlying arrat of lines.
 *
 *  Includes a trailing newline.
 *
 *  @param checkpoint The start index into the history array.
 *  @param length The end index into the history array.
 */
HistoryStore.prototype.getLines = function(checkpoint, length) {
  var lines = this._history.slice(
    checkpoint || this._checkpoint, length || this._history.length);
  lines = this._filter(lines);
  // add trailing newline
  if(lines[lines.length - 1]) {
    lines.push('');
  }
  return lines.join(EOL);
}


/**
 *  Import into this history store.
 *
 *  If content is a callback function all data is read from disc,
 *  otherwise content should be a string or array to import.
 *
 *  When content is specified the and this instance is flushing
 *  the file is written to disc.
 *
 *  If content is specified but no callback then the internal representation
 *  is updated but content is not flushed to disc.
 *
 *  @param content String or array to import.
 *  @param cb A callback function invoked when the history
 *  has been synced to disc or on error.
 */
HistoryStore.prototype.import = function(content, cb) {
  var scope = this;
  // no content so read the file and import the data
  if(typeof content === 'function') {
    cb = content;
    return fs.readFile(this.file, function(err, content) {
      if(err) return cb(err, null, scope);
      scope.stats(function(err) {
        if(err) return cb(err);
        scope._history = scope.readLines(content);
        scope._success();
        cb(null, content, scope);
      })
    })
  }
  // got string content, convert to an array
  if(Array.isArray(content)) content = this.readLines(content.slice(0));
  if(typeof content === 'string') content = this.readLines(content);
  assert(Array.isArray(content),
    'invalid history content type, must be array or string');

  // update internal representation
  this._history = content;
  this._checkpoint = 0;
  // write out if we have callback
  if(typeof cb === 'function') {
    this._sync(cb);
  }
}

/**
 *  Determine if the stored checkpoint is synchronized
 *  with the history array.
 *
 *  @return A boolean indicating if the internal checkpoint is at
 *  the end of the history array.
 */
HistoryStore.prototype.isFlushed = function() {
  return this._checkpoint === this._history.length;
}

/**
 *  Read the history file from disc and load it into
 *  this instance.
 *
 *  @param cb A callback function invoked when the history
 *  has been read from disc or on error.
 */
HistoryStore.prototype.read = function(cb) {
  var scope = this;
  cb = typeof cb === 'function' ? cb : noop;
  return this.import(function(err) {
    if(err && err.code === 'ENOENT' && create) {
      return touch(file, function(err) {
        if(err) return cb(err, scope);
        scope.read(options, cb);
      });
    }
    cb(err, scope);
  });
}

/**
 *  Add a line to this history store.
 *
 *  @param line The line to append.
 *  @param options The append options.
 *  @param cb A callback function invoked when the history
 *  has been synced to disc or on error.
 */
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
  assert(typeof line === 'string' || Array.isArray(line),
    'history entry must be array or string');

  if(Array.isArray(line)) {
    line = line.filter(function(item) {
      return '' + item;
    })
    this._history.concat(this._filter(line));
  }else if(typeof line === 'string') {
    if(!this._matches(line)) {
      return cb(null, scope);
    }
    line = '' + line;
    line = line.replace(/\r?\n$/, '');
    this._history.push(line);
  }

  var over = this._history.length > this.options.limit;
  if(!over) {
    this._write(flush, cb);
  }else{
    this._history.shift();
    this._sync(cb);
  }
}

/**
 *  Remove the last history item.
 *
 *  If this store is not set to flush to disc then this method
 *  acts like peek.
 *
 *  Truncates the history file when flushing to disc.
 *
 *  @param options The options.
 *  @param cb A callback function invoked when the history
 *  has been synced to disc or on error.
 */
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
      //scope._checkpoint = scope._history.length;
      scope._success();
    }
    cb(err, item, scope);
  })
}

HistoryStore.prototype._success = function() {
  this._checkpoint = this._history.length;
}

/**
 *  Remove all history items.
 *
 *  @param cb A callback function invoked when the history
 *  has been synced to disc or on error.
 */
HistoryStore.prototype.clear = function(cb) {
  var scope = this;
  fs.writeFile(this.file, '', function(err) {
    if(err) return cb(err, scope);
    scope._history = [];
    scope._success();
    cb(null, scope);
  })
}

/**
 *  Closes the underlying stream.
 *
 *  @param cb A callback function invoked when the
 *  stream has finished or on error.
 */
HistoryStore.prototype.close = function(cb) {
  if(this._stream) {
    this._stream.once('finish', cb);
    this._stream.end();
    this._stream = null;
  }
}

/**
 *  Write entire array to disc.
 *
 *  @param cb A callback function invoked when the
 *  write completes or on error.
 */
HistoryStore.prototype._sync = function(cb) {
  this._checkpoint = 0;
  this._write(this.getLines(), cb);
}

/**
 *  @private
 *
 *  Write to disc and update the internal stats upon successful write.
 */
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
  function write(stream, cb) {
    stream.write(contents, function onwrite(err) {
      if(err) return cb(err, scope);
      scope.stats(function(err) {
        if(err) return cb(err, scope);
        //scope._checkpoint = scope._history.length;
        scope._success();
        cb(null, scope);
      });
    });
  }
  if(!append) {
    var st = fs.createWriteStream(this.file, {flags: 'w+'});
    write.call(scope, st, function(err) {
      st.end();
      if(err) return cb(err, scope);
      cb(null, scope);
    });
  }else{
    write.call(scope, this._stream, cb);
  }
}

/**
 *  @private
 *
 *  Filter lines that match an ignore pattern.
 *
 *  @param lines Array of lines.
 *
 *  @return Filtered array of lines or the original array
 *  if no ignore patterns are configured.
 */
HistoryStore.prototype._filter = function(lines) {
  if(!this.options.ignores) return lines;
  var scope = this;
  return lines.filter(function(line) {
    return scope._matches(line);
  })
}

HistoryStore.prototype._matches = function(line) {
  if(!this.options.ignores) return line;
  var ignores = this.options.ignores || [];
  if(ignores instanceof RegExp) {
    ignores = [ignores];
  }
  var i, re;
  for(i = 0;i < ignores.length;i++) {
    re = ignores[i];
    if((re instanceof RegExp) && re.test(line)) {
      return false;
    }
  }
  return line;
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
  var opts = merge(this.options, {});
  opts = merge(options, opts);
  //console.dir(opts);
  assert(file, 'cannot load history with no file');
  file = path.normalize(file);
  if(stores[file] && !opts.force) {
    return cb(null, stores[file]);
  }

  var store = new HistoryStore(this, opts);
  stores[file] = store;
  store.read(function(err) {
    cb(err, store, scope);
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
