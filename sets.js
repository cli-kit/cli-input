var username = {
  key: 'name',
  message: '<username>',
  schema: {type: 'string'}
}

var password = {
  key: 'pass',
  message: '<password>',
  silent: true,
  schema: {type: 'string'}
}

var confirm = {
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

module.exports = {
  username: [username],
  password: [password],
  userpass: [username, password],
  confirm: [confirm]
}
