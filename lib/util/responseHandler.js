module.exports = handler;

function handler(status, data, message) {
  return {
    status: status,
    data: data,
    message: message || null
  };
}
