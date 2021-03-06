var ansi = require('ttycolor').ansi;

var colors = {
  name: function(v) {
    return ansi(v).blue.valueOf(true)
  },
  delimiter: function(v) {
    return ansi(v).cyan.valueOf(true)
  },
  parameters: function(a) {
    return a.slice(0).map(function(v) {
      if(!v) return v;
      return ansi(v).bright.valueOf(true);
    })
  }
}

module.exports = colors;

if(!module.parent) {
  console.error('utility module, not an example, try ansi.js');
  process.exit(1);
}
