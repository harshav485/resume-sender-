var express = require('express')
var cors = require('cors')
var bodyParser = require('body-parser')
var app = express()
const mongoose = require('mongoose')
var port = process.env.PORT || 3000

app.use(bodyParser.json())
app.use(cors())
app.use(
    bodyParser.urlencoded({
        extended: false
    })
)

const mongoURI = 'mongodb://localhost:27017/Login'

mongoose
    .connect(
        mongoURI, { useNewUrlParser: true }
    )
    .then(() => console.log('MongoDB Connected'))
    .catch(err => console.log(err))

var Users = require('./routes/Users')
var Router = require('./routes/all-expenses')

app.use('/users', Users)
app.use('/router', Router)

app.listen(port, function() {
    console.log('Server is running on port: ' + port)
})