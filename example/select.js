var prompt = require('..')
  , sets = prompt.sets
  , definitions = sets.definitions
  , ttycolor = require('ttycolor').defaults();

var name = require('path').basename(process.argv[1]);

/**
 *  Select from a list of options.
 */
var def = definitions.confirm.clone();
var ps = prompt();

ps.on('invalid', function(line, index, options, ps) {
  if(isNaN(index)) {
    console.error('%s ! not a number %s', name, line);
  }else{
    console.error(
      '%s ! not a known option index %s', name, line);
  }
})

var options = [
  'Javascript',
  'Ruby',
  'Perl',
];

var opts = {list: options};
var def = definitions.option.clone();
def.message = 'which language floats your boat (%s)?';
def.parameters = ['1-' + options.length];
opts.prompt = def;

ps.select(opts, function(err, res) {
  if(err || !res) return console.error(err);
  console.log('%s, really? cool.', res.value);
  process.exit(res ? 0 : 1);
});
