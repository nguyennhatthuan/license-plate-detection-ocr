const formidable = require('formidable')

const initForm = (imageDir = 'images/storage') => {
  const form = new formidable.IncomingForm()
  form.keepExtensions = true
  form.multiples = false
  form.maxFileSize = 10 * 1024 * 1024
  form.uploadDir = imageDir
  return form
}

// TODO: Should mkdir when init project

module.exports = {
  initForm
}
