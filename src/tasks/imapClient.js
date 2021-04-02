/**
 * Create an IMAP client if not defined and connected. Add event listeners.
 */

const { ImapFlow } = require('imapflow')

module.exports = {
  guard(m) {
    return !m.imapClientError && !m.private.imapClient && !m.imapClientConnected
  },

  async execute(m, { logger }) {
    const cfg = Object.assign(
      {
        port: 993,
        secure: true
      },
      m.$app.get('clients').imap,
      m.props.imap
    )

    logger.info('IMAP client connecting', {
      host: cfg.host,
      port: cfg.port
    })

    const client = new ImapFlow(cfg)

    try {
      await client.connect()
    } catch (err) {
      logger.error('IMAP client connect error', err)
      throw err
    }

    return client
  },

  assign(m, res, { logger }) {
    res.on('close', () => {
      logger.info('IMAP client closed')

      m.imapClientConnected = false
    })
    res.on('exists', data => {
      logger.info(`Message count in '${data.path}' is (${data.count})`)

      if (data.count) m.existsMail = true
    })
    res.on('mailboxClose', mailbox => {
      logger.info(`Mailbox ${mailbox.path} closed`)

      delete m.private.imapMailbox
    })
    res.on('error', err => {
      logger.error('IMAP client error', err)
    })

    m.private.imapClient = res
    m.imapClientConnected = true
    m.healthCheckTs = new Date().getTime()

    logger.info('IMAP connected')
  }
}
