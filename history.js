var fs = require('fs')
  , util = require('util')
  , events = require('events');

var History = function(options) {
  options = options || {};
  this.options = options;
}

util.inherits(History, events.EventEmitter);

History.prototype.load = function(cb) {
  cb();
}

function history(options, cb) {
  var h = new History(options);
  if(cb) {
    h.load(cb);
  }
  return h;
}

history.History = History;

module.exports = history;
