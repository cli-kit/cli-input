var prompt = require('..')
  , sets = prompt.sets
  , definitions = sets.definitions
  , ansi = require('ttycolor').ansi;

var repeat = require('cli-util').repeat;
var wrap = require('cli-util').wrap;
var delim = repeat(80, '+');

var available = Object.keys(ansi.codes.colors).concat(
  Object.keys(ansi.codes.attrs));

/**
 *  Use ANSI escape sequences.
 */

console.log('ansi: send SIGINT (Ctrl^C) to exit');
console.log(delim);
console.info('%s', wrap(available.join(', '), 0, 80));
console.log(delim);

var color = 'cyan';

var colors = {
  name: function(v) {
    return ansi(v)[color].valueOf(true)
  },
  delimiter: function(v) {
    return ansi(v).cyan.valueOf(true)
  },
  parameters: function(a) {
    return a.slice(0).map(function(v) {
      if(!v) return v;
      return ansi(v)[color].bright.valueOf(true);
    })
  }
}

var type = definitions.question.clone(
  {key: 'color', message: 'enter a %s name:', parameters: ['color']});

color.required = true;
color.repeat = true;

var set = [type];
var ps = prompt({infinite: true, colors: colors});
ps.run(set, function(err, res) {
  if(err) console.error(err);
  if(res && res.map) {
    if(!~available.indexOf(res.map.color)) {
      return console.error(
        'error: unknown color attribute name "%s"', res.map.color);
    }
    color = res.map.color;
  }
});
