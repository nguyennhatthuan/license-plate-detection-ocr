const response = (data, message = 'OK', error = false) => {
  return {
    data: data,
    message: message,
    error: error
  }
}

module.exports = {
  response
}
