/**
 * Init check mail flag in model.
 */

module.exports = {
  clear(m) {
    m.checkMail = m.existsMail
    m.existsMail = false
  },

  guard(m) {
    return false
  }, // Never run

  execute() {}
}
