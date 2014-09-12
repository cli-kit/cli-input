var prompt = require('..')
  , history = prompt.history
  , path = require('path');

var name = require('path').basename(process.argv[1]);

/**
 *  An infinite REPL style prompt with command history.
 */
var file = path.join(__dirname, '.history');
console.log('%s | send SIGINT (Ctrl^C) to exit', name);
console.log('%s | history file %s', name, file);
console.log('%s | experimental interpreter enabled (!!, !1 etc.)', name);

// write history file on exit
var opts = {file: file, exit: true};

history(opts, function(err, store, hs) {
  if(err) {
    console.error(err);
    process.exit(1);
  }

  // set up the prompt
  var ps = prompt({infinite: true});
  // tell the history file to mirror the readline history array
  store.mirror(ps.readline, null, true);
  ps.on('value', function(val, options, ps) {

    // handle interpreting !! etc. - EXPERIMENTAL
    if(Array.isArray(val)) {
      var histitem = store.interpret((val || []).join(' '));
      if(histitem) {
        options.value = histitem;
        return ps.run([options]);
      }
    }

    var history = store.history();

    if(val && val.length && val[0] === 'print') {
      return console.log(JSON.stringify(history, undefined, 2));
    }

    if(history.length) {
      console.log('%s | last history command is %s',
        name, history[0]);
      console.log('%s | first history command is %s',
        name, history[history.length -1]);
    }
  })
  ps.run();
});

