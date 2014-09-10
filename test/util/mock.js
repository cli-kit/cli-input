var path = require('path')
  , base = path.normalize(path.join(__dirname, '..', '..'))
  , target = path.join(base, 'target')
  , file = path.join(target, 'mock-history.txt')

var mock = {
  base: base,
  target: target,
  file: file,
  lines: [
    'history item 1',
    'history item 2'
  ]
}

module.exports = mock;
