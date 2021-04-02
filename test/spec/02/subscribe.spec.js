/**
 * Tests for subscribing to imported records
 */

const STAN = require('node-nats-streaming')

describe('Subscribe to imported records', function () {
  this.timeout(30000)

  let messages
  let stan
  let sub

  before(function () {
    const cfg = main.app.get('clients').stan
    stan = STAN.connect(cfg.cluster, 'test-email-subscribe', cfg.opts || {})

    return new Promise((resolve, reject) => {
      stan.once('connect', () => {
        resolve(stan)
      })
      stan.once('error', err => {
        reject(err)
      })
    }).then(() => {
      return new Promise(resolve => setTimeout(resolve, 1000))
    })
  })

  after(function () {
    return Promise.all([
      stan
        ? new Promise((resolve, reject) => {
            stan.removeAllListeners()
            stan.once('close', resolve)
            stan.once('error', reject)
            stan.close()
          })
        : Promise.resolve()
    ])
  })

  it('should subscribe', function () {
    const opts = stan.subscriptionOptions()
    opts.setDeliverAllAvailable()
    opts.setDurableName('importMessages')

    sub = stan.subscribe('email.importMessages.out', opts)
    messages = []
    sub.on('message', msg => {
      messages.push(JSON.parse(msg.getData()))
    })
  })

  it('should wait for 5 seconds to collect messages', function () {
    return new Promise(resolve => setTimeout(resolve, 5000))
  })

  it('should have imported messages', function () {
    sub.removeAllListeners()

    const uids = new Set(messages.map(message => message.payload.uid))

    expect(uids.size).to.equal(10)

    expect(messages).to.have.nested.property('0.context.org_slug', 'chi')
    expect(messages).to.have.nested.property('0.context.some_value', 'value')
    expect(messages).to.have.nested.property('0.context.imported_at')
    expect(messages).to.have.nested.property('0.payload.bodyParts.0.value')
    expect(messages).to.have.nested.property('0.payload.bodyParts.1.value.data')
    expect(messages).to.have.nested.property('0.payload.bodyStructure')
    expect(messages).to.have.nested.property(
      '0.payload.envelope.from.0.address',
      'sbdservice@sbd.iridium.com'
    )
  })
})
