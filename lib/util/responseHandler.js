module.exports = handler;

function handler(status, data, message) {
  if (status === 'fail') {
    console.log(data);
  }
  return {
    status: status || 'success',
    data: data,
    message: message || null
  };
}
