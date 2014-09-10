var path = require('path')
  , base = path.normalize(path.join(__dirname, '..', '..'))
  , target = path.join(base, 'target')
  , file = path.join(target, 'mock-history.txt')

var mock = {
  base: base,
  target: target,
  file: file,
}

module.exports = mock;
