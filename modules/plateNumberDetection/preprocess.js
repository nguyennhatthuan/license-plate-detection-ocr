const cv = require('opencv4nodejs')
const { EXPORT_STEP_BY_STEP_PICTURES } = require('./index')

const GAUSSIAN_SMOOTH_FILTER_SIZE = new cv.Size(5, 5)
const ADAPTIVE_THRESH_BLOCK_SIZE = 19
const ADAPTIVE_THRESH_WEIGHT = 9

const preprocess = async imgOriginal => {
  const imgGrayscale = await extractValue(imgOriginal)
  const imgMaxConstrastGrayscale = await maximizeContrast(imgGrayscale)
  const imgBlurred = await imgMaxConstrastGrayscale.gaussianBlurAsync(
    GAUSSIAN_SMOOTH_FILTER_SIZE,
    0
  )
  const imgThresh = await imgBlurred.adaptiveThresholdAsync(
    255.0,
    cv.ADAPTIVE_THRESH_GAUSSIAN_C,
    cv.THRESH_BINARY_INV,
    ADAPTIVE_THRESH_BLOCK_SIZE,
    ADAPTIVE_THRESH_WEIGHT
  )

  if (EXPORT_STEP_BY_STEP_PICTURES) {
    cv.imwrite(`./images/temp/plateNumberDetection/3 - Blurred.png`, imgBlurred)
    cv.imwrite(
      `./images/temp/plateNumberDetection/4 - Threshold.png`,
      imgThresh
    )
  }
  return {
    imgGrayscaleScene: imgGrayscale,
    imgThresholdScene: imgThresh
  }
}

const extractValue = async imgOriginal => {
  const imgHSV = await imgOriginal.cvtColorAsync(cv.COLOR_BGR2HSV)
  const result = imgHSV.split()

  if (EXPORT_STEP_BY_STEP_PICTURES) {
    // After split we get an array with 3 items: 0: imgHue, 1: imgSaturation, 2: imgValue
    result.forEach((i, index) =>
      cv.imwrite(`./images/temp/plateNumberDetection/1 - HSV ${ index }.png`, i)
    )
  }

  return result[2]
}

const maximizeContrast = async imgGrayscale => {
  const structuringElement = cv.getStructuringElement(
    cv.MORPH_RECT,
    new cv.Size(3, 3)
  )
  const imgTopHat = await imgGrayscale.morphologyExAsync(
    structuringElement,
    cv.MORPH_TOPHAT
  )
  const imgBlackHat = await imgGrayscale.morphologyExAsync(
    structuringElement,
    cv.MORPH_BLACKHAT
  )
  const imgGrayscalePlusTopHat = imgGrayscale.add(imgTopHat)
  const imgGrayscalePlusTopHatMinusBlackHat = imgGrayscalePlusTopHat.sub(
    imgBlackHat
  )

  if (EXPORT_STEP_BY_STEP_PICTURES) {
    cv.imwrite(
      `./images/temp/plateNumberDetection/2 - Maximize Constrast.png`,
      imgGrayscalePlusTopHatMinusBlackHat
    )
  }

  return imgGrayscalePlusTopHatMinusBlackHat
}

module.exports = {
  preprocess,
  maximizeContrast
}
