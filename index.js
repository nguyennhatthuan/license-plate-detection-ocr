const express = require('express')
const app = express()
const routes = require('./routes/index')

const port = process.env.PORT || process.env.port || process.env.Port || 8000

routes.assignRoutes(app)

const server = app.listen(port, () => {
  console.log(`server is listening on port ${ port }`)
})
