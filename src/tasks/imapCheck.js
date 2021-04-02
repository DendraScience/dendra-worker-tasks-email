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

    delete m.private.imapClient
    delete m.private.imapMailbox

    logger.error('IMAP client reset')
  }
}
