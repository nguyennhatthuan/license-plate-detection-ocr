const cv = require('opencv4nodejs')
const { detectPlatesInScene } = require('./detectPlatesInScene')
const { detectCharsInPlates } = require('./detectCharsInPlates')
const { handleCorrectPlateNumber } = require('./utils')

const EXPORT_STEP_BY_STEP_PICTURES = true

const handle = async args => {
  try {
    // Read Images
    const imgOriginalScrene = await cv
      .imreadAsync(args.path)
      .then(async image => await image.resizeToMaxAsync(1024))

    if (imgOriginalScrene === undefined) {
      throw Error('Error: Image not read from file')
    }

    const listOfPossiblePlates = await detectPlatesInScene(imgOriginalScrene)
    const listPlates = await detectCharsInPlates(listOfPossiblePlates)

    return handleCorrectPlateNumber(listPlates)
  } catch (ex) {}
}

module.exports = {
  handle,
  EXPORT_STEP_BY_STEP_PICTURES
}
