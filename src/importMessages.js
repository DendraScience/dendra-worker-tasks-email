module.exports = {
  checkMail: require('./tasks/checkMail'),
  fetchAndPublish: require('./tasks/fetchAndPublish'),
  healthCheck: require('./tasks/healthCheck'),
  imapCheck: require('./tasks/imapCheck'),
  imapClient: require('./tasks/imapClient'),
  imapMailbox: require('./tasks/imapMailbox'),
  source: require('./tasks/source'),
  sources: require('./tasks/sources'),
  stan: require('./tasks/stan'),
  stanCheck: require('./tasks/stanCheck'),
  versionTs: require('./tasks/versionTs')
}
