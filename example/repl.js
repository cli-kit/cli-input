var prompt = require('..')
  , exec = require('child_process').exec;

var name = require('path').basename(process.argv[1]);

/**
 *  An infinite REPL style prompt.
 */
console.log('%s | send SIGINT (Ctrl^C) to exit', name);
console.warn('%s | commands are executed via the shell, be careful', name);
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
