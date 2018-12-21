const tesseract = require('tesseract.js')

// 0 = Orientation and script detection (OSD) only.
// 1 = Automatic page segmentation with OSD.
// 2 = Automatic page segmentation, but no OSD, or OCR
// 3 = Fully automatic page segmentation, but no OSD. (Default)
// 4 = Assume a single column of text of variable sizes.
// 5 = Assume a single uniform block of vertically aligned text.
// 6 = Assume a single uniform block of text.
// 7 = Treat the image as a single text line.
// 8 = Treat the image as a single word.
// 9 = Treat the image as a single word in a circle.
// 10 = Treat the image as a single character.

const options = {
  lang: 'vie',
  psm: 6,
  tessedit_char_blacklist: "_-~<>=`!@#$%^&*()+;'[]{}"
}

const extractText = imagePath => {
  return tesseract.recognize(imagePath, options)
}

const optionsVNPlateNumber = {
  lang: 'eng',
  psm: 10,
  tessedit_char_blacklist: "_-~<>=`!@#$%^&*()+;'[]{} ",
  tessedit_char_whitelist: '0123456789ABCDEFGH',
  oem: 1
}

const extractPlateNumber = imagePath => {
  return tesseract.recognize(imagePath, optionsVNPlateNumber)
}

module.exports = {
  extractText,
  extractPlateNumber
}
