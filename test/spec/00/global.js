const chai = require('chai')
const feathers = require('@feathersjs/feathers')
const memory = require('feathers-memory')
const app = feathers()

const tm = require('@dendra-science/task-machine')
tm.configure({
  logger: console
})

app.logger = console

app.set('clients', {
  imap: {
    auth: {
      pass: process.env.IMAP_PASS,
      user: process.env.IMAP_USER
    },
    host: process.env.IMAP_HOST,
    port: process.env.IMAP_PORT,
    secure: true
  },
  stan: {
    client: 'test-email-{key}',
    cluster: 'test-cluster',
    opts: {
      uri: 'http://localhost:4222'
    }
  }
})

// Create an in-memory Feathers service for state docs
app.use(
  '/state/docs',
  memory({
    id: '_id',
    paginate: {
      default: 200,
      max: 2000
    },
    store: {}
  })
)

global.assert = chai.assert
global.expect = chai.expect
global.main = {
  app
}
global.tm = tm
