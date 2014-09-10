var expect = require('chai').expect;
var mock = require('../util/mock');
var fsutil = require('../util/fsutil');
var EOL = require('os').EOL;
var input= require('../..')
  , history = input.history
  , History = input.History;

describe('cli-input:', function() {
  var stash;

  it('should create history instance', function(done) {
    var h = history({});
    expect(h).to.be.instanceof(History);
    done();
  });

  it('should create history file', function(done) {
    history({file: mock.file}, function(err, store, history) {
      stash = store;
      expect(err).to.eql(null);
      expect(stash.isFlushed()).to.eql(true);
      var contents = fsutil.text(mock.file);
      expect(stash.stats()).to.be.an('object');
      expect(contents).to.eql('');
      expect(stash.history()).to.eql([]);
      done();
    });
  });

  it('should add history line', function(done) {
    stash.add(mock.lines[0], function(err) {
      expect(err).to.eql(null);
      expect(stash.isFlushed()).to.eql(true);
      var contents = fsutil.text(mock.file);
      expect(contents).to.eql(mock.lines[0] + EOL);
      done();
    })
  });

  it('should ignore duplicate line', function(done) {
    stash.add(mock.lines[0], function(err) {
      expect(err).to.eql(null);
      expect(stash.isFlushed()).to.eql(true);
      var contents = fsutil.text(mock.file);
      expect(contents).to.eql(mock.lines[0] + EOL);
      done();
    })
  });

  it('should add additional history line', function(done) {
    stash.add(mock.lines[1], function(err) {
      expect(err).to.eql(null);
      expect(stash.isFlushed()).to.eql(true);
      var contents = fsutil.text(mock.file);
      expect(contents).to.eql(mock.lines.slice(0, 2).join(EOL) + EOL);
      done();
    })
  });

  it('should pop history item', function(done) {
    stash.pop(function(err) {
      expect(err).to.eql(null);
      expect(stash.isFlushed()).to.eql(true);
      var contents = fsutil.text(mock.file);
      //console.dir(contents);
      expect(contents).to.eql(mock.lines[0] + EOL);
      done();
    })
  });

  it('should close history file stream', function(done) {
    stash.close(done);
  });

  it('should open history file', function(done) {
    history({file: mock.file}, function(err, store, history) {
      stash = store;
      expect(err).to.eql(null);
      expect(stash.isFlushed()).to.eql(true);
      var contents = fsutil.text(mock.file);
      expect(contents).to.eql(mock.lines[0] + EOL);
      done();
    });
  });

  it('should read history file', function(done) {
    stash.read(function(err) {
      expect(err).to.eql(null);
      expect(stash.isFlushed()).to.eql(true);
      var contents = fsutil.text(mock.file);
      expect(contents).to.eql(mock.lines[0] + EOL);
      done();
    })
  });

  it('should import history file string', function(done) {
    stash.import(mock.lines[1], function(err) {
      expect(err).to.eql(null);
      expect(stash.isFlushed()).to.eql(true);
      var contents = fsutil.text(mock.file);
      expect(contents).to.eql(mock.lines[1] + EOL);
      done();
    })
  });

  it('should import history array', function(done) {
    stash.import([mock.lines[0]], function(err) {
      expect(err).to.eql(null);
      expect(stash.isFlushed()).to.eql(true);
      var contents = fsutil.text(mock.file);
      expect(contents).to.eql(mock.lines[0] + EOL);
      done();
    })
  });

  it('should respect limit on add', function(done) {
    stash.options.limit = 2;
    var expected = [mock.lines[1], mock.extra];
    stash.import(mock.lines, function(err) {
      expect(err).to.eql(null);
      expect(stash.isFlushed()).to.eql(true);
      stash.add(mock.extra, function(err) {
        expect(err).to.eql(null);
        expect(stash.isFlushed()).to.eql(true);
        expect(stash.history().length).to.eql(stash.options.limit);
        expect(stash.history()).to.eql(expected);
        var contents = fsutil.text(mock.file);
        //console.dir(contents);
        expect(contents).to.eql(expected.join(EOL) + EOL);
        done();
      })
    })
  });

  it('should respect limit on import array', function(done) {
    stash.options.limit = 2;
    var lines = ['1','2','3'];
    var expected = ['2', '3'];
    stash.import(lines, function(err) {
      expect(err).to.eql(null);
      expect(stash.isFlushed()).to.eql(true);
      expect(stash.history().length).to.eql(stash.options.limit);
      expect(stash.history()).to.eql(expected);
      var contents = fsutil.text(mock.file);
      expect(contents).to.eql(expected.join(EOL) + EOL);
      done();
    })
  });

  it('should respect limit on import string', function(done) {
    stash.options.limit = 2;
    var lines = ['1','2','3'];
    var expected = ['2', '3'];
    stash.import(lines.join(EOL), function(err) {
      expect(err).to.eql(null);
      expect(stash.isFlushed()).to.eql(true);
      expect(stash.history().length).to.eql(stash.options.limit);
      expect(stash.history()).to.eql(expected);
      var contents = fsutil.text(mock.file);
      expect(contents).to.eql(expected.join(EOL) + EOL);
      done();
    })
  });

  it('should clear history file', function(done) {
    stash.clear(function(err) {
      expect(err).to.eql(null);
      expect(stash.isFlushed()).to.eql(true);
      var contents = fsutil.text(mock.file);
      expect(contents).to.eql('');
      done();
    })
  });
});
