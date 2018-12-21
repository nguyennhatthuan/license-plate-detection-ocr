const { uri } = require('./config')
const { extractDriverLicense } = require('./driverLicense')
const { extractIdentityCard } = require('./identityCard')
const { extractCanCuoc } = require('./canCuoc')
const { extractPlateNumber } = require('./plateNumber')

exports.assignRoutes = app => {
  app.get('/', (req, res) => res.json({ message: 'Hello World! Surveyor Ocr' }))
  app.post(`${ uri }/driver-license`, extractDriverLicense) // http://localhost:8000/api/v1/driver-license
  app.post(`${ uri }/identity-card`, extractIdentityCard) // http://localhost:8000/api/v1/identity-card
  app.post(`${ uri }/can-cuoc`, extractCanCuoc) // http://localhost:8000/api/v1/can-cuoc
  app.post(`${ uri }/plate-number`, extractPlateNumber) // http://localhost:8000/api/v1/plate-number
  // Resgister Route Here
}
