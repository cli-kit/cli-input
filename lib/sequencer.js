var assert = require('assert')
  , EOL = require('os').EOL
  , util = require('util');

var SequenceResult = function(options) {
  options = options || {};
  for(var k in options) {
    this[k] = options[k];
  }
}

SequenceResult.prototype.isPromptEqual = function() {
  return this.seq && this.prompt
    && this.seq.msg && this.prompt.msg
    && this.seq.msg === this.prompt.msg;
}

SequenceResult.prototype.write = function(cb) {
  var scope = this;
  var str = this.seq.input;
  var evt = this.item && this.item.type ? this.item.type : 'value';

  // told to listen for a particular event
  if(this.seq.evt) {
    evt = this.seq.evt;
  }

  this.ps.once(evt, function(res, options, ps) {
    //console.log('seq got event');
    if(typeof cb === 'function') {
      cb(scope, evt, res, options, ps);
    }
  })

  this.rl.write(str + EOL);

  // duplicate content to output stream so result files
  // contain data that matches the entire sequence (not just the prompts)
  if(this.file) {
    this.file.write(str + EOL);
  }
}

var Sequencer = function(options) {
  options = options || {};
  this.ps = options.ps;
  delete options.ps;
  this.output = options.output;
  delete options.output;
  assert(this.ps, 'you must specify a prompt instance to create a sequence');
  this.prefix = util.format('%s %s ',
    this.ps.options.name, this.ps.options.delimiter);
}

Sequencer.prototype.run = function(sequence, set, cb) {
  var ps = this.ps;
  var input = ps.input;
  var output = ps.output;
  var file = this.output;
  var prefix = this.prefix;
  var index = 0;

  // after the prompt is displayed
  ps.on('ready', function(opts, rl) {
    var seq = sequence[index];
    if(seq.msg && prefix) {
      if(seq.msg.indexOf(prefix) !== 0) {
        seq.msg = prefix + seq.msg;
      }
    }
    if(!seq) return false;

    var res = new SequenceResult(
      {
        ps: ps,
        index: index,
        sequence: sequence,
        input: input,
        output: output,
        file: file,
        seq: seq,
        item: set[index],
        set: set,
        opts: opts,
        rl: rl,
        prompt: {
          msg: opts.raw,
          len: opts.length
        }
      }
    );

    // write out the desired input
    res.write(seq.cb);

    index++;
    return res;
  })

  ps.run(set, function(err, res) {
    if(typeof cb === 'function') {
      cb(err, res);
    }
  });
}

module.exports = Sequencer;
