const cv = require('opencv4nodejs')
const _ = require('lodash')
const Subtract = require('array-subtract')
const { extractNumberSegment, extractData } = require('./utils')

const MIN_PIXEL_AREA = 80
const MIN_PIXEL_WIDTH = 2
const MIN_PIXEL_HEIGHT = 8
const MIN_ASPECT_RATIO = 0.25
const MAX_ASPECT_RATIO = 1.0

const MIN_DIAG_SIZE_MULTIPLE_AWAY = 0.3
const MAX_DIAG_SIZE_MULTIPLE_AWAY = 5.0
const MAX_CHANGE_IN_AREA = 0.5
const MAX_CHANGE_IN_WIDTH = 0.8
const MAX_CHANGE_IN_HEIGHT = 0.2
const MAX_ANGLE_BETWEEN_CHARS = 12.0

const MIN_NUMBER_OF_MATCHING_CHARS = 3
const RESIZED_CHAR_IMAGE_WIDTH = 20
const RESIZED_CHAR_IMAGE_HEIGHT = 30
const MIN_CONTOUR_AREA = 100

const subtractContoursArray = new Subtract(
  (a, b) => JSON.stringify(a) === JSON.stringify(b)
)

const possibleChar = countour => {
  const rect = countour.boundingRect()
  return {
    countour,
    intBoundingRectX: rect.x,
    intBoundingRectY: rect.y,
    intBoundingRectWidth: rect.width,
    intBoundingRectHeight: rect.height,
    intBoundingRectArea: rect.width * rect.height,
    intCenterX: (rect.x + rect.x + rect.width) / 2,
    intCenterY: (rect.y + rect.y + rect.height) / 2,
    fltDiagonalSize: Math.sqrt(
      Math.pow(rect.width, 2) + Math.pow(rect.height, 2)
    ),
    fltAspectRatio: rect.width / rect.height
  }
}

const checkIfPossibleChar = possibleChar => {
  return (
    possibleChar.intBoundingRectArea > MIN_PIXEL_AREA &&
    possibleChar.intBoundingRectWidth > MIN_PIXEL_WIDTH &&
    possibleChar.intBoundingRectHeight > MIN_PIXEL_HEIGHT &&
    MIN_ASPECT_RATIO < possibleChar.fltAspectRatio &&
    possibleChar.fltAspectRatio < MAX_ASPECT_RATIO
  )
}

const findListOfListsOfMatchingChars = listOfPossibleChars => {
  const listOfListsOfMatchingChars = []
  for (let i = 0; i < listOfPossibleChars.length; i++) {
    const possibleChar = listOfPossibleChars[i]
    const listOfMatchingChars = findListOfMatchingChars(
      possibleChar,
      listOfPossibleChars
    )
    listOfMatchingChars.push(possibleChar)
    if (listOfMatchingChars.length < MIN_NUMBER_OF_MATCHING_CHARS) continue

    listOfListsOfMatchingChars.push(listOfMatchingChars)

    const listOfPossibleCharsWithCurrentMatchesRemoved = subtractContoursArray.sub(
      listOfPossibleChars,
      listOfMatchingChars
    )
    const recursiveListOfListsOfMatchingChars = findListOfListsOfMatchingChars(
      listOfPossibleCharsWithCurrentMatchesRemoved
    )
    recursiveListOfListsOfMatchingChars.forEach(recursiveListOfMatchingChars =>
      listOfListsOfMatchingChars.push(recursiveListOfMatchingChars)
    )
    break
  }
  return listOfListsOfMatchingChars
}

const findListOfMatchingChars = (possibleChar, listOfChars) => {
  const listOfMatchingChars = []
  listOfChars.forEach(possibleMatchingChar => {
    if (possibleMatchingChar !== possibleChar) {
      const fltDistanceBetweenChars = distanceBetweenChars(
        possibleChar,
        possibleMatchingChar
      )
      const fltAngleBetweenChars = angleBetweenChars(
        possibleChar,
        possibleMatchingChar
      )

      const fltChangeInArea =
        Math.abs(
          possibleMatchingChar.intBoundingRectArea -
            possibleChar.intBoundingRectArea
        ) / possibleChar.intBoundingRectArea

      const fltChangeInWidth =
        Math.abs(
          possibleMatchingChar.intBoundingRectWidth -
            possibleChar.intBoundingRectWidth
        ) / possibleChar.intBoundingRectWidth
      const fltChangeInHeight =
        Math.abs(
          possibleMatchingChar.intBoundingRectHeight -
            possibleChar.intBoundingRectHeight
        ) / possibleChar.intBoundingRectHeight

      if (
        fltDistanceBetweenChars <
          possibleChar.fltDiagonalSize * MAX_DIAG_SIZE_MULTIPLE_AWAY &&
        fltAngleBetweenChars < MAX_ANGLE_BETWEEN_CHARS &&
        fltChangeInArea < MAX_CHANGE_IN_AREA &&
        fltChangeInWidth < MAX_CHANGE_IN_WIDTH &&
        fltChangeInHeight < MAX_CHANGE_IN_HEIGHT
      ) {
        listOfMatchingChars.push(possibleMatchingChar)
      }
    }
  })
  return listOfMatchingChars
}

const distanceBetweenChars = (firstChar, secondChar) => {
  const intX = Math.abs(firstChar.intCenterX - secondChar.intCenterX)
  const intY = Math.abs(firstChar.intCenterY - secondChar.intCenterY)
  return Math.sqrt(Math.pow(intX, 2) + Math.pow(intY, 2))
}

const angleBetweenChars = (firstChar, secondChar) => {
  const fltAdj = Math.abs(firstChar.intCenterX - secondChar.intCenterX)
  const fltOpp = Math.abs(firstChar.intCenterY - secondChar.intCenterY)
  let fltAngleInRad
  if (fltAdj !== 0.0) fltAngleInRad = Math.atan(fltOpp / fltAdj)
  else fltAngleInRad = 1.5708
  return fltAngleInRad * (180.0 / Math.PI)
}

const findPossibleCharsInPlate = async imgThresh => {
  const listOfPossibleChars = []
  const contours = await imgThresh.findContoursAsync(
    cv.RETR_LIST,
    cv.CHAIN_APPROX_SIMPLE
  )

  contours.forEach(contour => {
    const posChar = possibleChar(contour)
    if (checkIfPossibleChar(posChar)) {
      listOfPossibleChars.push(posChar)
    }
  })

  return listOfPossibleChars
}

const removeInnerOverlappingChars = listOfMatchingChars => {
  const listOfMatchingCharsWithInnerCharRemoved = listOfMatchingChars.slice(0)
  for (let i = 0; i < listOfMatchingChars.length; i++) {
    for (let j = 0; j < listOfMatchingChars.length; j++) {
      const currentChar = listOfMatchingChars[i]
      const otherChar = listOfMatchingChars[j]

      if (currentChar !== otherChar) {
        if (
          distanceBetweenChars(currentChar, otherChar) <
          currentChar.fltDiagonalSize * MIN_DIAG_SIZE_MULTIPLE_AWAY
        ) {
          if (currentChar.intBoundingRectArea < otherChar.intBoundingRectArea) {
            if (listOfMatchingCharsWithInnerCharRemoved.includes(currentChar)) {
              _.pull(listOfMatchingCharsWithInnerCharRemoved, currentChar)
            }
          } else {
            if (listOfMatchingCharsWithInnerCharRemoved.includes(otherChar)) {
              _.pull(listOfMatchingCharsWithInnerCharRemoved, otherChar)
            }
          }
        }
      }
    }
  }
  return listOfMatchingCharsWithInnerCharRemoved
}

const recognizeCharsInPlate = async (
  imgThresh,
  longestListOfMatchingCharsInPlate
) => {
  let strChars = ''
  const listOfMatchingChars = _.sortBy(longestListOfMatchingCharsInPlate, [
    'intCenterX'
  ])

  const imgThreshColor = await imgThresh.cvtColorAsync(cv.COLOR_GRAY2BGR)

  for (let i = 0; i < listOfMatchingChars.length; i++) {
    const currentChar = listOfMatchingChars[i]
    imgThreshColor.drawRectangle(
      new cv.Point2(currentChar.intBoundingRectX, currentChar.intBoundingRectY),
      new cv.Point2(
        currentChar.intBoundingRectX + currentChar.intBoundingRectWidth,
        currentChar.intBoundingRectY + currentChar.intBoundingRectHeight
      ),
      new cv.Vec3(0, 255, 0),
      2
    )

    const imgROI = imgThresh
      .getRegion(
        new cv.Rect(
          currentChar.intBoundingRectX,
          currentChar.intBoundingRectY,
          currentChar.intBoundingRectWidth,
          currentChar.intBoundingRectHeight
        )
      )
      .resize(new cv.Size(RESIZED_CHAR_IMAGE_WIDTH, RESIZED_CHAR_IMAGE_HEIGHT))

    // cv.imwrite(
    //   `./images/temp/plateNumberDetection/imgROI ${ Date.now().toString() }.png`,
    //   imgROI
    // )
  }
  // cv.imwrite(
  //   `./images/temp/plateNumberDetection/imgThreshColor ${ Date.now().toString() }.png`,
  //   imgThreshColor
  // )

  return strChars
}

const recognizeCharsInPlate_ = async possiblePlate => {
  const result = await extractNumberSegment(possiblePlate.imgPlate)
  if (!result.isSuccess) return ''

  const plateNumber = await extractData(result)
  return plateNumber
}

module.exports = {
  possibleChar,
  checkIfPossibleChar,
  distanceBetweenChars,
  findListOfListsOfMatchingChars,
  findPossibleCharsInPlate,
  removeInnerOverlappingChars,
  recognizeCharsInPlate,
  recognizeCharsInPlate_
}
