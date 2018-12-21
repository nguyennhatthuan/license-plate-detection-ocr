const carPlateRegex = /\d{2}[A-Z]\d{5}/gm // /[0-9][0-9][A-Z][0-9][0-9][0-9][0-9][0-9]/gm
const carPlateRegexOld = /\d{2}[A-Z]\d{4}/gm
const bikePlateRegex = /\d{2}[A-Z]\d{6}/gm

const isVietnamPlate = (width, height) => {
  const ratio = width / height
  return (ratio > 4.07 && ratio < 4.47) || (ratio > 1.2 && ratio < 1.6)
}

const matchingPlateNumber = input => {
  const plate = input.replace(/[^a-zA-Z0-9 ]/g, '')
  let matchingPlate = plate.match(carPlateRegex)
  if (matchingPlate !== null) return matchingPlate[0]

  matchingPlate = plate.match(carPlateRegexOld)
  if (matchingPlate !== null) return matchingPlate[0]

  matchingPlate = plate.match(bikePlateRegex)
  if (matchingPlate !== null) return matchingPlate[0]

  return plate
}

module.exports = {
  isVietnamPlate,
  matchingPlateNumber
}
