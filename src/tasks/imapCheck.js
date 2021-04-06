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
    const { imapClient } = m.private

    // HACK: Prevent errors from old clients
    if (imapClient.socket && imapClient.streamer)
      imapClient.socket.unpipe(imapClient.streamer)

    imapClient.removeAllListeners()

    delete m.private.imapClient
    delete m.private.imapMailbox

    logger.error('IMAP client reset')
  }
}
