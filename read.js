var readline = require('readline')
var Mute = require('mute-stream')
  , rl;

var errors = {
  cancel: new Error('cancelled'),
  timeout: new Error('timed out')
}

errors.cancel.cancel = true;
errors.timeout.timeout = true;

function open(opts) {
  //console.log('opening rl interface');
  close();
  opts = opts || {};
  opts.input = opts.input || process.stdin
  opts.output = opts.output || process.stdout
  opts.terminal = !!(opts.terminal || opts.output.isTTY)
  rl = readline.createInterface(opts)
}

function close() {
  if(rl) {
    rl.removeAllListeners();
    rl.close();
    rl = null;
  }
}

function read (opts, cb) {
  if (typeof opts.default !== 'undefined' &&
      typeof opts.default !== 'string' &&
      typeof opts.default !== 'number') {
    throw new Error('default value must be string or number')
  }
  var input = opts.input || process.stdin
  var output = opts.output || process.stdout
  opts.rl = opts.rl || {};
  var prompt = (opts.prompt || '');
  var silent = opts.silent
  var editDef = false
  var timeout = opts.timeout
    , rlopts
    , m;

  var def = opts.default || ''
  if (def) {
    if (silent) {
      //prompt += '(<default hidden>) '
    } else if (opts.edit) {
      editDef = true
    //} else {
      //prompt += '(' + def + ') '
    }
  }

  //var terminal = !!(opts.terminal || output.isTTY)

  if(silent) {
    m = new Mute({ replace: opts.replace, prompt: prompt })
    m.pipe(output, {end: false})
    output = opts.rl.output = m
  }

  if(!rl || silent) {
    open(opts.rl);
  }

  rl.setPrompt(prompt, opts.length || prompt.length);
  rl.prompt();

  if (silent) {
    //console.log('muting stream');
    output.mute()
  } else if (editDef) {
    rl.line = def
    rl.cursor = def.length
    rl._refreshLine()
  }

  var timer;

  // TODO: work out the line listener leak (infinite mode)
  // TODO: this should not be necessary
  rl.removeAllListeners('line');
  rl.removeAllListeners('error');

  rl.on('line', onLine);
  rl.on('error', onError);

  rl.on('SIGINT', function () {
    rl.close()
    onError(errors.cancel);
  })

  if(timeout) {
    timer = setTimeout(function () {
      onError(errors.timeout)
    }, timeout)
  }

  function done (err, line, isDefault) {

    rl.removeListener('line', onLine);
    rl.removeListener('error', onError);
    rl.removeAllListeners('SIGINT');

    //console.log('read done() callback %s', rl.listeners('line').length);

    clearTimeout(timer);
    if(output instanceof Mute) {
      opts.rl.output = process.stdout;
      output.unmute()
      output.end()
      close();
    }

    if(err) return cb(err);
    cb(null, line, isDefault)
  }

  function onError (err) {
    done(err);
  }

  function onLine (line) {
    if(output instanceof Mute) {
      output.unmute()
      //output.write('\r\n')
    }

    // truncate the \n at the end.
    line = line.replace(/\r?\n$/, '')
    var isDefault = !!(editDef && line === def)
    if (def && !line) {
      isDefault = true
      line = def
    }
    //console.log('read got line %s', line);
    done(null, line, isDefault);
  }
}

module.exports = read
module.exports.errors = errors
module.exports.rl = rl;
