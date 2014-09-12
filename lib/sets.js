var utils = require('cli-util')
  , merge = utils.merge;

var PromptDefinition = require('./definition');

var username = new PromptDefinition(
  {
    type: 'username',
    key: 'name',
    message: '<username>',
    schema: {type: 'string'},
    required: true,
    repeat: true
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
var newpass = password.clone();
newpass.equal = true;
newpass.confirmation = 'confirm';

var definitions = {
  username: username,
  password: password,
  confirm: confirm,
  question: question,
}

var sets = {
  username: [username],
  password: [password],
  userpass: [username, password],
  confirm: [confirm],
  newpass: [newpass],
  question: [question],
}

sets.definitions = definitions;
module.exports = sets;
