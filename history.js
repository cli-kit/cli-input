var EOL = require('os').EOL
  , fs = require('fs')
  , assert = require('assert')
  , path = require('path')
  , util = require('util')
  , events = require('events');

var stores = {};

var HistoryStore = function(parent, options, lines) {
  options = options || {};
  console.dir(lines);
  lines = lines.split('\n');
  lines = lines.filter(function(line) {
    line = line.replace(/\r$/, '');
    line = line.trim();
    return line;
  })
  options.flush = options.flush !== undefined ? options.flush : true;
  options.duplicates = options.duplicates !== undefined
    ? options.duplicates : false;
  this.parent = parent;
  this.file = options.file;
  this.options = options;
  this.history = lines;
  console.dir(lines);
  this.stream = fs.createWriteStream(this.file, {flags: 'a'});
  this.offset = this.history.length;
}

HistoryStore.prototype.isFlushed = function() {
  return this.offset === this.history.length;
}

HistoryStore.prototype.write = function(flush, cb) {
  var scope = this;
  if(!flush || this.offset === this.history.length) return cb(null, scope);
  console.log('write to disc %s %s', this.offset, this.history.length);
  var lines = this.history.slice(this.offset, this.history.length);
  // add trailing newline
  if(lines[lines.length - 1]) {
    lines.push('');
  }
  var append = lines.join(EOL);
  console.log('write to disc %j', append);

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
  if(!this.options.duplicates && ~this.history.indexOf(line)) {
    //console.log('ignoring duplicate');
    return cb(null, scope);
  }
  console.log('flush %s', flush);
  assert(typeof line === 'string', 'history entry must be a string')
  line = '' + line;
  line = line.replace(/\r?\n$/, '');
  this.history.push(line);
  this.write(flush, cb);
}

//HistoryStore.prototype.close = function

HistoryStore.prototype.clear = function(cb) {
  var scope = this;
  fs.writeFile(this.file, '', function(err) {
    if(err) return cb(err, scope);
    scope.history = [];
    scope.offset = 0;
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
    //console.log('isFlushed: %s', store.isFlushed());
    store.add('line item');
    store.add('line item');
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
