var readline = require('readline')
var Mute = require('mute-stream')
  , rl;

var errors = {
  cancelled: new Error('cancelled'),
  timeout: new Error('timed out')
}

errors.cancelled.cancel = true;

function init(opts) {
  if(!rl) {
    rl = readline.createInterface(opts)
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
  var prompt = (opts.prompt || '').replace(/\s+$/, '') + ' ';
  var silent = opts.silent
  var editDef = false
  var timeout = opts.timeout
    , rlopts;

  var def = opts.default || ''
  if (def) {
    if (silent) {
      prompt += '(<default hidden>) '
    } else if (opts.edit) {
      editDef = true
    } else {
      prompt += '(' + def + ') '
    }
  }
  var terminal = !!(opts.terminal || output.isTTY)

  if(silent) {
    var m = new Mute({ replace: opts.replace, prompt: prompt })
    m.pipe(output, {end: false})
    output = m
  }

  if(!rl) {
    rlopts = opts.rl || {};
    rlopts.input = input;
    rlopts.output = output;
    rlopts.terminal = terminal;
    rl = readline.createInterface(rlopts)
  }

  if(output instanceof Mute) output.unmute()
  rl.setPrompt(prompt)
  rl.prompt()
  if (silent) {
    output.mute()
  } else if (editDef) {
    rl.line = def
    rl.cursor = def.length
    rl._refreshLine()
  }

  var called = false
  rl.once('line', onLine)
  rl.once('error', onError)

  rl.on('SIGINT', function () {
    rl.close()
    onError(errors.cancelled);
  })

  var timer
  if (timeout) {
    timer = setTimeout(function () {
      onError(errors.timeout)
    }, timeout)
  }

  function done () {
    called = true
    //rl.close()
    rl.removeListener('line', onLine);
    rl.removeListener('error', onError);
    rl.removeAllListeners('SIGINT');

    clearTimeout(timer);

    if(silent) {
      output.mute()
      output.end()
    }
  }

  function onError (er) {
    if (called) return
    done()
    return cb(er)
  }

  function onLine (line) {
    if (called) return
    if (silent && terminal) {
      output.unmute()
      output.write('\r\n')
    }
    done()
    // truncate the \n at the end.
    line = line.replace(/\r?\n$/, '')
    var isDefault = !!(editDef && line === def)
    if (def && !line) {
      isDefault = true
      line = def
    }
    cb(null, line, isDefault)
  }
}

module.exports = read
module.exports.errors = errors
module.exports.rl = rl;
