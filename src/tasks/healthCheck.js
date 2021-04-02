/**
 * Check for missing data, force a disconnect if detected.
 */

module.exports = {
  guard(m) {
    return (
      !m.healthCheckError &&
      !m.healthCheckReady &&
      m.private.imapClient &&
      m.imapClientConnected
    )
  },

  async execute(m, { logger }) {
    const ts = new Date().getTime()
    const threshold = m.state.health_check_threshold

    logger.info('Health check started')

    if (
      threshold &&
      m.healthCheckTs &&
      ts - m.healthCheckTs > threshold * 1000
    ) {
      logger.error('Health check threshold exceeded')
      logger.info('IMAP client disconnecting')

      try {
        // Prevent the mailbox from being reopened
        m.private.imapClient.removeAllListeners('mailboxClose')

        await m.private.imapClient.mailboxClose()
      } catch (err) {
        logger.error('IMAP client mailbox close error', err)
        // Don't rethrow
      }
      try {
        await m.private.imapClient.logout()
      } catch (err) {
        logger.error('IMAP client logout error', err)
        throw err
      }
    }

    logger.info('Health check passed')

    return true
  }
}
