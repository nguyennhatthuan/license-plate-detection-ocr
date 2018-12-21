const _ = require('lodash')
const fs = require('fs')
const rimraf = require('rimraf')

const getNameFromPath = path => {
  const res = path.split('\\')
  return _.last(res)
}

const createDirByName = name => {
  try {
    fs.mkdirSync(name)
  } catch (ex) {
    throw Error(`Can not create new folder path ${ name } with error: ${ ex }`)
  }
}

const deleteAllFilesInDir = name => {
  try {
    rimraf(name)
  } catch (ex) {
    throw Error(`Can not remove folder path: ${ name } with error: ${ ex }`)
  }
}

module.exports = {
  getNameFromPath,
  createDirByName,
  deleteAllFilesInDir
}
