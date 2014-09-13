function completer(line, cb) {
  var completions = 'help error exit quit q'.split(' ');
  var hits = completions.filter(
    function(c) { return c.indexOf(line) == 0 });
  return cb(null, [hits.length ? hits : completions, line]);
}

module.exports = completer;

if(!module.parent) {
  console.error('utility module, not an example, try completion.js');
  process.exit(1);
}
