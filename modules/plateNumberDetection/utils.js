const cv = require('opencv4nodejs')
const { createDirByName } = require('../../utils/file')
const _ = require('lodash')
const { extractPlateNumber } = require('../ocr')
const { maximizeContrast } = require('./preprocess')
const { matchingPlateNumber } = require('../../utils/plate')

const extractNumberSegment = async imgPlate => {
  const result = {
    isSuccess: false
  }

  let grayPlate = await imgPlate.cvtColorAsync(cv.COLOR_BGR2GRAY)

  const imgMaxConstrastGrayscale = await maximizeContrast(grayPlate)
  const imgBlurred = await imgMaxConstrastGrayscale.gaussianBlurAsync(
    new cv.Size(5, 5),
    0.6
  )
  //   let imgThresh = await imgBlurred.adaptiveThresholdAsync(
  //     255.0,
  //     cv.ADAPTIVE_THRESH_GAUSSIAN_C,
  //     cv.THRESH_BINARY_INV,
  //     19,
  //     9
  //   )

  const imgThresh = imgBlurred.resize(new cv.Size(0, 0), 1.6, 1.6)
  // | -> +
  const plateThreshold = await imgThresh.thresholdAsync(
    0,
    255,
    cv.THRESH_BINARY | cv.THRESH_OTSU
  )
  const kernel = cv.getStructuringElement(cv.MORPH_RECT, new cv.Size(2.2, 2.2))
  const plateMor = await plateThreshold.morphologyExAsync(
    kernel,
    cv.MORPH_DILATE
  )

  const plateCountours = await plateMor.findContoursAsync(
    cv.RETR_LIST,
    cv.CHAIN_APPROX_NONE
  )

  let listOfPossibleChars = []

  for (let i = 0; i < plateCountours.length; i++) {
    const rect = plateCountours[i].boundingRect()
    listOfPossibleChars.push(rect)
  }

  listOfPossibleChars = _.sortBy(listOfPossibleChars, ['x'])

  result.path = `./images/temp/plateNumberDetection/${ Date.now().toString() }`
  let pictureCount = 0
  createDirByName(result.path)
  for (let i = 0; i < listOfPossibleChars.length; i++) {
    let rect = listOfPossibleChars[i]
    const ratio = rect.width / rect.height
    if (
      rect.width < rect.height &&
      rect.height > 36 &&
      ratio > 0.25 &&
      ratio < 0.75
    ) {
      let roi = plateMor.getRegion(rect)
      cv.imwrite(`${ result.path }/${ ++pictureCount }.png`, roi)
    }
  }
  if (pictureCount > 1 && pictureCount < 14) {
    result.length = pictureCount
    result.isSuccess = true
  }

  return result
}

const extractData = async result => {
  let plate = ''
  try {
    if (result.isSuccess) {
      const promises = []

      for (let i = 1; i <= result.length; i++) {
        const promise = extractPlateNumber(`${ result.path }/${ i }.png`)
          .then(r => {
            console.log('Text detect: ', r.text)
            console.log('---')
            if (r.text.trim().length === 1) plate += r.text.trim()
          })
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

const handleCorrectPlateNumber = listPossiblePlates => {
  let listPlates = listPossiblePlates.filter(value => value.strChars !== '')
  listPlates = _.sortBy(listPlates, p => p.length).reverse()

  let plate = ''
  listPlates.forEach(p => (plate += p.strChars))

  return matchingPlateNumber(plate)
}

module.exports = {
  extractNumberSegment,
  extractData,
  handleCorrectPlateNumber
}
