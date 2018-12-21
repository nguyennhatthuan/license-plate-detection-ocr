const groupSameSize = listMatrix => {
  const listFloorNumberByDivideTen = []
  listMatrix.forEach(mat => {
    const result = Math.floor(mat.rows / 10)
    const indexResult = listFloorNumberByDivideTen.findIndex(
      ele => ele.heightDivided === result
    )
    if (indexResult > -1) {
      listFloorNumberByDivideTen[indexResult].count++
    } else {
      listFloorNumberByDivideTen.push({ heightDivided: result, count: 1 })
    }
  })

  return listFloorNumberByDivideTen
}

module.exports = {
  groupSameSize
}
