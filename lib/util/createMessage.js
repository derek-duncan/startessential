function _message(msg) {
  return '?message=' + encodeURIComponent(msg);
}

module.exports = _message;
