/**
 * Trigger IMAP reconnect if we're supposed to be connected and we're not.
 */

module.exports = {
  guard(m) {
    return (
      !m.imapCheckError &&
      !m.imapCheckReady &&
      m.private.imapClient &&
      !m.imapClientConnected
    )
  },

  execute(m) {
    return true
  },

  assign(m, res, { logger }) {
    m.private.imapClient.removeAllListeners()

    // HACK: Handle errors from old clients
    m.private.imapClient.once('error', err => {
      logger.error('IMAP (old) client error', err)
    })

    delete m.private.imapClient
    delete m.private.imapMailbox

    logger.error('IMAP client reset')
  }
}
