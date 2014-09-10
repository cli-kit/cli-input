var fs = require('fs')
  , assert = require('assert')
  , path = require('path')
  , util = require('util')
  , events = require('events');

var stores = {};

var HistoryStore = function(file, lines) {
  this.file = file;
  lines = lines.split('\n');
  lines = lines.filter(function(line) {
    line = line.replace(/\r$/, '');
    line = line.trim();
    return line;
  })
  this.history = lines;
}

var History = function(options) {
  options = options || {};
  options.create = options.create !== undefined ? options.create : true;
  this.options = options;
}

util.inherits(History, events.EventEmitter);

History.prototype.load = function(options, cb) {
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
      if(err) return cb(err);
      st.end();
      st.destroy();
      load(options, cb);
    });
  }
  fs.readFile(file, function(err, contents) {
    if(err.code === 'ENOENT' && create) {
      return touch();
    }
    if(err) return cb(err);
    var store = new HistoryStore(file, contents);
    stores[file] = store;
    cb(null, store);
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
