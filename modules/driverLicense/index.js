const cv = require('opencv4nodejs')
const fs = require('fs')
const xml2json = require('xml2json')
const _ = require('lodash')
const { extractText } = require('../ocr/index')

const extractData = pathImage => {
  return new Promise((resolve, reject) => {
    let mat = cv.imread(`./${ pathImage }`)
    var xml = fs.readFileSync('./modules/driverLicense/training.xml', 'utf8')

    const jsonLabelImg = JSON.parse(xml2json.toJson(xml))
    mat = mat.bilateralFilter(15, 70, 70, cv.BORDER_DEFAULT)
    mat = mat.bgrToGray()

    mat = mat.resize(
      parseInt(jsonLabelImg.annotation.size.height),
      parseInt(jsonLabelImg.annotation.size.width),
      0,
      0,
      cv.INTER_AREA
    )
    const fields = jsonLabelImg.annotation.object
    let promises = []
    let textOutput = {}

    fields.forEach((field, i) => {
      let roiMatrix = mat.getRegion(
        new cv.Rect(
          field.bndbox.xmin,
          field.bndbox.ymin,
          field.bndbox.xmax - field.bndbox.xmin,
          field.bndbox.ymax - field.bndbox.ymin
        )
      )
      // roiMatrix = roiMatrix.threshold(60, 255, cv.THRESH_BINARY);
      // roiMatrix = roiMatrix.adaptiveThreshold(255, cv.ADAPTIVE_THRESH_MEAN_C, cv.THRESH_BINARY, 25, 0);

      cv.imwrite(`./images/temp/driver-licence${ i }.jpg`, roiMatrix)
      const promise = extractText(`./images/temp/driver-licence${ i }.jpg`).then(
        function(result) {
          _.set(textOutput, field.name, result.text.trim())
        }
      )
      promises.push(promise)
    })

    Promise.all(promises)
      .then(() => {
        resolve(textOutput)
      })
      .catch(err => {
        reject(new Error(err))
      })
  })
}

module.exports = {
  extractData
}
