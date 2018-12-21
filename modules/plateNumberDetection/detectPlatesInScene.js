const cv = require('opencv4nodejs')
const { preprocess } = require('./preprocess')
const {
  possibleChar,
  checkIfPossibleChar,
  findListOfListsOfMatchingChars,
  distanceBetweenChars
} = require('./possibleChar')
const { possiblePlate } = require('./possiblePlate')
const _ = require('lodash')
const { EXPORT_STEP_BY_STEP_PICTURES } = require('./index')

const PLATE_WIDTH_PADDING_FACTOR = 1.3
const PLATE_HEIGHT_PADDING_FACTOR = 1.5

const detectPlatesInScene = async imgOriginaScene => {
  const listOfPossiblePlates = []

  const { imgThresholdScene } = await preprocess(imgOriginaScene)

  const listOfPossibleCharsInScene = await findPossibleCharsInScene(
    imgThresholdScene
  )

  const listOfListsOfMatchingCharsInScene = findListOfListsOfMatchingChars(
    listOfPossibleCharsInScene
  )

  for (let i = 0; i < listOfListsOfMatchingCharsInScene.length; i++) {
    const listOfMatchingChars = listOfListsOfMatchingCharsInScene[i]
    const posPlate = await extractPlate(imgOriginaScene, listOfMatchingChars)
    if (posPlate.imgPlate !== undefined) {
      listOfPossiblePlates.push(posPlate)
    }
  }

  return listOfPossiblePlates
}

const findPossibleCharsInScene = async imgThresh => {
  const listOfPossibleChars = []

  // TODO: Not Clone
  const contours = imgThresh.findContours(cv.RETR_LIST, cv.CHAIN_APPROX_SIMPLE)

  if (contours === undefined || contours.length === 1) {
    throw Error('No contour found')
  }

  contours.forEach((contour, index) => {
    const pChar = possibleChar(contour)
    if (checkIfPossibleChar(pChar)) {
      listOfPossibleChars.push(pChar)
    }
  })

  return listOfPossibleChars
}

const extractPlate = async (imgOriginal, listOfMatchingChars) => {
  const posPlate = possiblePlate()
  const listOfMatchingCharsSorted = _.sortBy(listOfMatchingChars, [
    'intCenterX'
  ])
  const fltPlateCenterX =
    (listOfMatchingCharsSorted[0].intCenterX +
      listOfMatchingCharsSorted[listOfMatchingCharsSorted.length - 1]
        .intCenterX) /
    2.0
  const fltPlateCenterY =
    (listOfMatchingChars[0].intCenterY +
      listOfMatchingCharsSorted[listOfMatchingCharsSorted.length - 1]
        .intCenterY) /
    2.0

  // Tuple

  const intPlateWidth = parseInt(
    (listOfMatchingCharsSorted[listOfMatchingCharsSorted.length - 1]
      .intBoundingRectX +
      listOfMatchingCharsSorted[listOfMatchingCharsSorted.length - 1]
        .intBoundingRectWidth -
      listOfMatchingCharsSorted[0].intBoundingRectX) *
      PLATE_WIDTH_PADDING_FACTOR
  )

  let intTotalOfCharHeights = 0
  listOfMatchingCharsSorted.forEach(
    matchingChar =>
      (intTotalOfCharHeights += matchingChar.intBoundingRectHeight)
  )

  const fltAverageCharHeight =
    intTotalOfCharHeights / listOfMatchingCharsSorted.length

  const intPlateHeight = parseInt(
    fltAverageCharHeight * PLATE_HEIGHT_PADDING_FACTOR
  )

  const fltOpposite =
    listOfMatchingCharsSorted[listOfMatchingCharsSorted.length - 1].intCenterY -
    listOfMatchingCharsSorted[0].intCenterY

  const fltHypotenuse = distanceBetweenChars(
    listOfMatchingCharsSorted[0],
    listOfMatchingCharsSorted[listOfMatchingCharsSorted.length - 1]
  )

  const fltCorrectionAngleInRad = Math.asin(fltOpposite / fltHypotenuse)
  const fltCorrectionAngleInDeg = fltCorrectionAngleInRad * (180.0 / Math.PI)

  posPlate.rrLocationOfPlateInScene = {
    ptPlateCenter: {
      fltPlateCenterX,
      fltPlateCenterY
    },
    ptPlaceSize: {
      intPlateWidth,
      intPlateHeight
    },
    fltCorrectionAngleInDeg
  }

  const rotationMatrix = cv.getRotationMatrix2D(
    new cv.Point2(fltPlateCenterX, fltPlateCenterY),
    fltCorrectionAngleInDeg,
    1.0
  )

  const imgRotated = await imgOriginal.warpAffineAsync(
    rotationMatrix,
    new cv.Size(imgOriginal.cols, imgOriginal.rows)
  )

  // Ensure that coordinate not below 0
  let xCrop = fltPlateCenterX - intPlateWidth / 2
  let yCrop = fltPlateCenterY - intPlateHeight / 2
  if (xCrop < 0 || yCrop < 0) {
    xCrop = fltPlateCenterX
    yCrop = fltPlateCenterY
  }

  // cv.imwrite(
  //   `./images/temp/plateNumberDetection/imgRotated ${ Math.random() }.png`,
  //   imgRotated
  // )

  if (
    xCrop + intPlateWidth < imgRotated.cols &&
    yCrop + intPlateHeight < imgRotated.rows
  ) {
    const imgCropped = imgRotated.getRegion(
      new cv.Rect(xCrop, yCrop, intPlateWidth, intPlateHeight)
    )

    posPlate.imgPlate = imgCropped
    // cv.imwrite(
    //   `./images/temp/plateNumberDetection/imgCropped ${ Date.now().toString() }.png`,
    //   imgCropped
    // )
  }

  return posPlate
}

module.exports = {
  detectPlatesInScene
}
