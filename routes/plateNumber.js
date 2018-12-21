const { extractData } = require('../modules/plateNumber/index')
const { handle } = require('../modules/plateNumberDetection/index')
const { initForm } = require('../utils/formData')
const { getNameFromPath } = require('../utils/file')
const { response } = require('../models/response')

const extractPlateNumber = async (req, res, next) => {
  const form = initForm('images/storage/plateNumber')
  form.parse(req, async (error, fields, file) => {
    const image = {
      path: file.image.path,
      name: getNameFromPath(file.image.path)
    }
    try {
      const result = await handle(image)
      res.send(response({ plate: result }))
    } catch (ex) {
      res.send(response('', ex, true))
    }
  })
}

module.exports = {
  extractPlateNumber
}
