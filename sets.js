var utils = require('cli-util')
  , merge = utils.merge;

/**
 *  Represents a prompt definition.
 */
var PromptDefinition = function(options) {
  options = options || {};
  var k, v;
  for(k in options) {
    if(typeof this[k] === 'function') {
      throw new Error('cannot override prompt definition function ' + k);
    }
    v = options[k];
    this[k] = v;
  }
  this.options = options;
}

/**
 *  Clone this prompt definition.
 */
PromptDefinition.prototype.copy = function() {
  return new PromptDefinition(this.options);
}

var username = new PromptDefinition(
  {
    type: 'username',
    key: 'name',
    message: '<username>',
    schema: {type: 'string'}
  }
);

var password = new PromptDefinition(
  {
    type: 'password',
    key: 'pass',
    message: '<password>',
    history: false,
    silent: true,
    schema: {type: 'string'},
    required: true,
    repeat: true
  }
);

var confirm = new PromptDefinition(
  {
    type: 'binary',
    key: 'confirm',
    message: 'are you sure? (y/n)',
    schema: {type: 'string'},
    history: false,
    repeat: true,
    acceptable: 'y',
    rejectable: 'n',
    accept: /^y(es)?$/, // accepts y | yes, but not *ye*
    reject: /^no?$/     // accepts no | n
  }
);

var question = new PromptDefinition(
  {
    key: 'question',
    message: '%s?',
    schema: {type: 'string'},
    expand: false
  }
);

// a password prompt that confirms passwords match (equal)
var newpass = merge(password, {});
newpass.type = 'password';
newpass.equal = true;
newpass.confirmation = 'confirm';

module.exports = {
  username: [username],
  password: [password],
  userpass: [username, password],
  confirm: [confirm],
  newpass: [newpass],
  question: [question],
}
