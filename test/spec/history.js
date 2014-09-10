var expect = require('chai').expect;
var mock = require('../util/mock');
var fsutil = require('../util/fsutil');
var EOL = require('os').EOL;
var input= require('../..')
  , history = input.history
  , History = input.History
  , HistoryFile = history.HistoryFile;

describe('cli-input:', function() {
  var stash;

  it('should create history instance', function(done) {
    var h = history({create:true});
    expect(h).to.be.instanceof(History);
    done();
  });

  it('should create history file', function(done) {
    var hs = history({file: mock.file}, function(err, store, history) {
      stash = store;
      expect(err).to.eql(null);
      expect(hs).to.eql(history).to.be.instanceof(History);
      expect(hs.store(mock.file)).to.eql(store);
      expect(hs.store()).to.be.an('object');
      expect(store).to.be.instanceof(HistoryFile);
      expect(stash.isFlushed()).to.eql(true);
      var contents = fsutil.text(mock.file);
      expect(stash.file).to.be.a('string')
        .to.eql(mock.file);
      expect(stash.options).to.be.an('object');
      expect(stash.stats()).to.be.an('object');
      expect(contents).to.eql('');
      expect(stash.history()).to.eql([]);
      expect(stash.position()).to.eql(0);
      expect(stash.next()).to.eql(false);
      expect(stash.previous()).to.eql(false);
      expect(stash.reset()).to.eql(0);

      stash.add(['a', 'b', 'c'], function(){
        //console.dir(stash.history());
        expect(stash.position()).to.eql(2);
        expect(stash.next()).to.eql(false);
        expect(stash.previous()).to.eql('b');
        expect(stash.previous()).to.eql('a');
        expect(stash.previous()).to.eql(false);
        stash.add(['d'], function(){
          expect(stash.position()).to.eql(3);
          expect(stash.start()).to.eql('a');
          expect(stash.end()).to.eql('d');
          expect(stash.move(1)).to.eql('b');
          expect(stash.move(16)).to.eql(false);
          expect(stash.move(-1)).to.eql(false);
          expect(stash.reset()).to.eql(3);
          // fake a peek
          stash.options.flush = false;
          stash.pop(function(err, item, store) {
            expect(item).to.eql('d');
            //console.dir(item);
            stash.options.flush = true;
            stash.clear(done);
          });
        });
      });
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

  it('should respect ignore patterns', function(done) {
    var opts = {
      file: mock.file,
      ignores: /^a.*/,
      force: true
    }
    var lines = ['a', 'b', 'c'];
    var expected = lines.slice(1);
    history(opts, function(err, store, history) {
      store.import(lines,  function(err) {
        expect(store.history()).to.eql(expected);
        store.add('abracadabra', function(err) {
          expect(store.history()).to.eql(expected);
          var contents = fsutil.text(mock.file);
          expect(contents).to.eql(expected.join(EOL) + EOL);
          done(err);
        })
      });
    });
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

  //it('should fire exit event', function(done) {
    //var opts = {
      //exit: true,
      //file: mock.file
    //}
    //var lines = ['a', 'b', 'c'];
    ////var expected = lines.slice(1);
    //history(opts, function(err, store, history) {
      //store.once('exit', function() {
        //done();
      //});
    //});
  //});
});
