"use strict";

/**
 * Open an IMAP mailbox if not defined.
 */
module.exports = {
  guard(m) {
    return !m.imapMailboxError && !m.imapMailboxReady && !m.private.imapMailbox && m.private.imapClient && m.imapClientConnected;
  },

  execute(m, {
    logger
  }) {
    logger.info('IMAP mailbox opening');
    return m.private.imapClient.mailboxOpen('INBOX');
  },

  assign(m, res, {
    logger
  }) {
    m.private.imapMailbox = res;
    m.checkMail = true;
    logger.info('IMAP mailbox opened');
  }

};