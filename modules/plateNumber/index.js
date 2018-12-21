const cv = require('opencv4nodejs')
const _ = require('lodash')
const { extractPlateNumber } = require('../ocr')
const { createDirByName } = require('../../utils/file')
const { isVietnamPlate } = require('../../utils/plate')

const plateDetection = async args => {
  const result = { isSuccess: false, path: undefined }
  try {
    let image = await cv.imreadAsync(args.path)
    image = await image.resizeToMaxAsync(500)

    let gray = await image.cvtColorAsync(cv.COLOR_BGR2GRAY)
    gray = await gray.bilateralFilterAsync(11, 17, 17)
    gray = gray.canny(60, 60 * 3)

    let contours = await gray.findContoursAsync(
      cv.RETR_LIST,
      cv.CHAIN_APPROX_SIMPLE
    )

    contours = _.sortBy(contours, ['area'])
      .reverse()
      .slice(0, 30)

    let plate
    for (let i = 0; i < contours.length; i++) {
      let approx = contours[i].approxPolyDP(
        0.02 * contours[i].arcLength(true),
        true
      )
      let rect = contours[i].boundingRect()
      if (approx.length === 4 && isVietnamPlate(rect.width, rect.height)) {
        plate = image.getRegion(rect)
        break
      }
    }

    if (plate === undefined) throw Error('Plate not found')

    let grayPlate = await plate.cvtColorAsync(cv.COLOR_BGR2GRAY)
    const plateThreshold = await grayPlate.thresholdAsync(
      0,
      255,
      cv.THRESH_BINARY + cv.THRESH_OTSU
    )
    const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2, 2))
    const plateMor = await plateThreshold.morphologyExAsync(
      kernel,
      cv.MORPH_DILATE
    )

    let plateCountours = await plateMor.findContoursAsync(
      cv.RETR_LIST,
      cv.CHAIN_APPROX_NONE
    )

    // plateCountours = _.sortBy(plateCountours, ['area']).reverse()
    plateCountours = plateCountours.reverse()

    result.path = `./images/temp/plateNumber/${ args.name }`
    let pictureCount = 1
    createDirByName(result.path)
    for (let i = 0; i < plateCountours.length; i++) {
      let rect = plateCountours[i].boundingRect()
      if (rect.height > 18 && rect.height < 30 && rect.width < 18) {
        let roi = plateMor.getRegion(rect)
        cv.imwrite(`${ result.path }/${ pictureCount }.png`, roi)
        pictureCount++
      }
    }
    result.length = pictureCount
    result.isSuccess = true
  } catch (ex) {
    throw Error(ex)
  }
  return result
}

const extractData = async imagePath => {
  let plate = ''
  try {
    const result = await plateDetection(imagePath)
    if (result.isSuccess) {
      const promises = []

      for (let i = 1; i < result.length; i++) {
        const promise = extractPlateNumber(`${ result.path }/${ i }.png`)
          .then(r => (plate += r.text.trim()))
          .catch(error => console.log('Error: ', error))

        promises.push(promise)
      }

      await Promise.all(promises)
        .then(res => {})
        .catch(error => console.log('Error: ', error))
    }
  } catch (ex) {
    throw Error(ex)
  }
  return plate
}

module.exports = {
  extractData
}
