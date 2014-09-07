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

module.exports = {
  username: [username],
  password: [password],
  userpass: [username, password]
}
