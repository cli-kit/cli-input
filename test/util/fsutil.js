var fs = require('fs')
  , path = require('path')
  , mock = require('./mock');

var fsutil = {};
fsutil.file = function(name, content) {
  var file = path.join(mock.target, name);
  if(content) fs.writeFileSync(file, content);
  return file;
}

fsutil.getWriteStream = function(name) {
  return fs.createWriteStream(fsutil.file(name));
}

fsutil.rmfile = function(file) {
  fs.unlinkSync(file);
}

fsutil.json = function(file) {
  var contents = fsutil.text(file);
  return JSON.parse(contents);
}

fsutil.text = function(file) {
  return '' + fs.readFileSync(file);
}

fsutil.require = function(file) {
  return require(file);
}

module.exports = fsutil;
