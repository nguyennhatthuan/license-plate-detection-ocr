const cv = require('opencv4nodejs')
const { preprocess } = require('./preprocess')
const { recognizeCharsInPlate_ } = require('./possibleChar')

const detectCharsInPlates = async listOfPossiblePlates => {
  if (listOfPossiblePlates.length === 0) return listOfPossiblePlates

  for (let i = 0; i < listOfPossiblePlates.length; i++) {
    const possiblePlate = listOfPossiblePlates[i]
    const { imgGrayscaleScene, imgThresholdScene } = await preprocess(
      possiblePlate.imgPlate
    )
    possiblePlate.imgGrayscale = imgGrayscaleScene
    possiblePlate.imgThresh = imgThresholdScene

    possiblePlate.imgThresh = possiblePlate.imgThresh.resize(
      new cv.Size(0, 0),
      1.6,
      1.6
    )

    possiblePlate.imgThresh = await possiblePlate.imgThresh.thresholdAsync(
      0.0,
      255.0,
      cv.THRESH_BINARY | cv.THRESH_OTSU
    )

    // const listOfPossibleCharsInPlate = await findPossibleCharsInPlate(
    //   possiblePlate.imgThresh
    // )

    // const listOfListsOfMatchingCharsInPlate = findListOfListsOfMatchingChars(
    //   listOfPossibleCharsInPlate
    // )

    // for (let i = 0; i < listOfListsOfMatchingCharsInPlate.length; i++) {
    //   listOfListsOfMatchingCharsInPlate[i] = _.sortBy(
    //     listOfListsOfMatchingCharsInPlate[i],
    //     ['intCenterX']
    //   )

    //   listOfListsOfMatchingCharsInPlate[i] = removeInnerOverlappingChars(
    //     listOfListsOfMatchingCharsInPlate[i]
    //   )
    // }

    // let intLenOfLongestListOfChars = 0
    // let intIndexOfLongestListOfChars = 0

    // for (let i = 0; i < listOfListsOfMatchingCharsInPlate.length; i++) {
    //   if (
    //     listOfListsOfMatchingCharsInPlate[i].length > intLenOfLongestListOfChars
    //   ) {
    //     intLenOfLongestListOfChars = listOfListsOfMatchingCharsInPlate[i].length
    //     intIndexOfLongestListOfChars = i
    //   }
    // }
    // const longestListOfMatchingCharsInPlate =
    //   listOfListsOfMatchingCharsInPlate[intIndexOfLongestListOfChars]

    // possiblePlate.strChars = await recognizeCharsInPlate(
    //   possiblePlate.imgThresh,
    //   longestListOfMatchingCharsInPlate
    // )
    possiblePlate.strChars = await recognizeCharsInPlate_(possiblePlate)
  }
  return listOfPossiblePlates
}

module.exports = {
  detectCharsInPlates
}
