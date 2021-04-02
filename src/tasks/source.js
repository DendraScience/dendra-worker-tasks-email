/**
 * Determine and assign source properties in model after the sources are ready.
 */

module.exports = {
  clear(m) {
    delete m.source
    delete m.sourceKey

    m.sourceIndex = 0
  },

  guard(m) {
    return (
      !m.sourceError &&
      !m.source &&
      m.sources &&
      m.sourceIndex < m.sourceKeys.length &&
      m.sourcesTs === m.versionTs
    )
  },

  execute() {
    return true
  },

  assign(m, res, { logger }) {
    m.sourceKey = m.sourceKeys[m.sourceIndex]
    m.source = m.sources[m.sourceKey]

    logger.info('Source ready', { sourceKey: m.sourceKey })
  }
}
