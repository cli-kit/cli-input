var prompt = require('..')
  , exec = require('child_process').exec;

/**
 *  An infinite REPL style prompt.
 */
console.log('repl: send SIGINT (Ctrl^C) to exit');
console.warn('repl: commands are executed via the shell, be careful');
var ps = prompt({infinite: true});
ps.on('value', function(val) {
  var cmd = val.join(' ');
  var opts = {stdio: 'inherit'};
  // pause the prompt while we evaluate the command
  ps.pause();
  exec(cmd, opts, function(err, stdout, stderr) {
    var code = err && err.code ? err.code : 0;
    if(code === 0) {
      process.stdout.write(stdout);
    }else{
      process.stderr.write(stderr);
    }
    // resume the prompt
    ps.resume();
  })
})
ps.run();
