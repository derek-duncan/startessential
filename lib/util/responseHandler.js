module.exports = handler;

function handler(status, data, message) {
  return {
    status: status || 'success',
    data: data,
    message: message || null
  };
}
