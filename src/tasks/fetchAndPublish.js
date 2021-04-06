/**
 * Fetch messages and publish to NATS. Flag processed messages.
 */

module.exports = {
  clear(m) {
    m.totalFlaggedCount = 0
  },

  guard(m) {
    return (
      m.private.stan &&
      m.stanConnected &&
      m.private.imapClient &&
      m.imapClientConnected &&
      m.private.imapMailbox &&
      m.source &&
      m.checkMail
    )
  },

  async execute(m, { logger }) {
    const { source } = m
    const { imapClient, stan } = m.private
    const {
      context,
      decode_parts: decodeParts,
      message_limit: messageLimit,
      pub_to_subject: pubSubject
    } = source
    const query = Object.assign({}, source.search, {
      flagged: false
    })

    let foundUids = []
    let selectCount = 0
    let publishCount = 0
    let flaggedCount = 0

    logger.info('Searching mailbox', { query })
    try {
      foundUids = await imapClient.search(query, { uid: true })
      logger.info(`Search returned (${foundUids.length}) messages(s)`)
    } catch (err) {
      logger.error('Search error', err)
    }

    for (const uid of foundUids) {
      let message
      let payload
      let guid

      if (selectCount >= messageLimit) break

      selectCount++

      logger.info('Fetching message', { uid })
      try {
        message = await imapClient.fetchOne(
          uid,
          {
            bodyParts: source.fetch_parts,
            bodyStructure: true,
            envelope: true,
            flags: true,
            size: true
          },
          { uid: true }
        )
        logger.info('Fetched message', { uid })
      } catch (err) {
        logger.error('Fetch error', err)
      }

      if (message) {
        logger.info('Decoding message', { uid })
        try {
          const { bodyParts, uid } = message
          payload = {
            bodyParts: [],
            bodyStructure: message.bodyStructure,
            envelope: message.envelope,
            flags: message.flags && Array.from(message.flags),
            size: message.size,
            uid
          }
          if (bodyParts) {
            if (Array.isArray(decodeParts))
              decodeParts.forEach(({ key, type }) => {
                let value = bodyParts.get(key)
                if (type === 'string') value = value.toString()
                else if (type === 'base64')
                  value = Buffer.from(value.toString(), 'base64')
                bodyParts.set(key, value)
              })

            bodyParts.forEach((value, key) => {
              payload.bodyParts.push({
                key,
                value
              })
            })
          }
          logger.info('Decoded message', { uid })
        } catch (err) {
          logger.error('Decode error', err)
        }
      }

      if (payload) {
        logger.info('Publishing message', { uid })
        try {
          const msgStr = JSON.stringify({
            context: Object.assign({}, context, {
              imported_at: new Date()
            }),
            payload // IMAP envelope, body parts and structure
          })

          guid = await new Promise((resolve, reject) => {
            stan.publish(pubSubject, msgStr, (err, guid) =>
              err ? reject(err) : resolve(guid)
            )
          })
          publishCount++

          logger.info('Published message', { uid, pubSubject, guid })
        } catch (err) {
          logger.error('Publish error', err)
        }
      }

      await new Promise(resolve => setTimeout(resolve, 1000))

      if (guid) {
        logger.info('Flagging message', { uid })
        try {
          await imapClient.messageFlagsAdd(uid, ['\\Flagged'], { uid: true })
          flaggedCount++

          logger.info('Flagged message', { uid })
        } catch (err) {
          logger.error('Flag error', err)
        }
      }
    }

    return {
      foundCount: foundUids.length,
      selectCount,
      publishCount,
      flaggedCount
    }
  },

  assign(m, res, { logger }) {
    logger.info(
      `Found (${res.foundCount}) messages(s), selected (${res.selectCount}), published (${res.publishCount}), flagged (${res.flaggedCount})`
    )

    m.totalFlaggedCount += res.flaggedCount
    m.healthCheckTs = new Date().getTime()
    m.sourceIndex++

    // Check mail on the next run if we found more than we processed
    if (res.foundCount > res.flaggedCount) m.existsMail = true

    delete m.source
  }
}
