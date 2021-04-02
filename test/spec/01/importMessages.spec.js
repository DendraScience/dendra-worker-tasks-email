/**
 * Tests for importMessages tasks
 */

describe('importMessages tasks', function () {
  this.timeout(180000)

  const now = new Date()
  const model = {
    props: {},
    state: {
      _id: 'taskMachine-importMessages-current',
      health_check_threshold: 1200,
      source_defaults: {
        some_default: 'default'
      },
      sources: [
        {
          context: {
            make: 'stilltek',
            model: 'igage',
            org_slug: 'chi',
            some_value: 'value',
            unit: '300234067049310'
          },
          decode_parts: [
            {
              key: '1',
              type: 'string'
            },
            {
              key: '2',
              type: 'base64'
            }
          ],
          description: 'Iridium',
          fetch_parts: ['1', '2'],
          message_limit: 5,
          pub_to_subject: 'email.importMessages.out',
          search: {
            from: 'sbdservice@sbd.iridium.com',
            subject: 'SBD Msg From Unit: 300234067049310'
          }
        }
      ],
      created_at: now,
      updated_at: now
    }
  }

  Object.defineProperty(model, '$app', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: main.app
  })
  Object.defineProperty(model, 'key', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: 'importMessages'
  })
  Object.defineProperty(model, 'private', {
    enumerable: false,
    configurable: false,
    writable: false,
    value: {}
  })

  let tasks
  let machine

  after(function () {
    return Promise.all([
      model.private.imapClient
        ? model.private.imapClient.logout()
        : Promise.resolve(),

      model.private.stan
        ? new Promise((resolve, reject) => {
            model.private.stan.removeAllListeners()
            model.private.stan.once('close', resolve)
            model.private.stan.once('error', reject)
            model.private.stan.close()
          })
        : Promise.resolve()
    ])
  })

  it('should import', function () {
    tasks = require('../../../dist').importMessages

    expect(tasks).to.have.property('sources')
  })

  it('should create machine', function () {
    machine = new tm.TaskMachine(model, tasks, {
      helpers: {
        logger: console
      },
      interval: 500
    })

    expect(machine).to.have.property('model')
  })

  it('should import IMAP messages 1st time', function () {
    model.scratch = {}

    return machine
      .clear()
      .start()
      .then(success => {
        /* eslint-disable-next-line no-unused-expressions */
        expect(success).to.be.true

        // Verify task state
        expect(model).to.have.property('checkMailReady', false)
        expect(model).to.have.property('fetchAndPublishReady', true)
        expect(model).to.have.property('healthCheckReady', true)
        expect(model).to.have.property('imapCheckReady', false)
        expect(model).to.have.property('imapClientReady', true)
        expect(model).to.have.property('imapMailboxReady', true)
        expect(model).to.have.property('sourceReady', true)
        expect(model).to.have.property('sourcesReady', true)
        expect(model).to.have.property('stanReady', true)
        expect(model).to.have.property('stanCheckReady', false)
        expect(model).to.have.property('versionTsReady', false)

        // Verify source
        expect(model).to.have.property('sourceKey', '$0')

        // Check for defaults
        expect(model).to.have.nested.property(
          'sources.$0.some_default',
          'default'
        )

        // Verify processing
        expect(model).to.have.property('sourceIndex', 1)
        expect(model).to.have.property('totalFlaggedCount', 5)
        expect(model).to.have.property('checkMail', true)
        expect(model).to.have.property('existsMail', true)
      })
  })

  it('should import IMAP messages 2nd time', function () {
    model.scratch = {}

    return machine
      .clear()
      .start()
      .then(success => {
        /* eslint-disable-next-line no-unused-expressions */
        expect(success).to.be.true

        // Verify task state
        expect(model).to.have.property('checkMailReady', false)
        expect(model).to.have.property('fetchAndPublishReady', true)
        expect(model).to.have.property('healthCheckReady', true)
        expect(model).to.have.property('imapCheckReady', false)
        expect(model).to.have.property('imapClientReady', false)
        expect(model).to.have.property('imapMailboxReady', false)
        expect(model).to.have.property('sourceReady', true)
        expect(model).to.have.property('sourcesReady', false)
        expect(model).to.have.property('stanReady', false)
        expect(model).to.have.property('stanCheckReady', false)
        expect(model).to.have.property('versionTsReady', false)

        // Verify source
        expect(model).to.have.property('sourceKey', '$0')

        // Verify processing
        expect(model).to.have.property('sourceIndex', 1)
        expect(model).to.have.property('totalFlaggedCount', 5)
        expect(model).to.have.property('checkMail', true)
        expect(model).to.have.property('existsMail', true)
      })
  })
})
