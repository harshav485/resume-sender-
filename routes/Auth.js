const cors = require('cors')
const jwt = require('jsonwebtoken')
const User = require('../models/User')



process.env.SECRET_KEY = 'secret'

function decode(req, res, next) {
    // var decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY)
    jwt.verify(req.headers['authorization'], process.env.SECRET_KEY, function(err, decoded) {
        if (err) {
            return res.send('Invalid token', status = 401)
        }
        User.findOne({
                _id: decoded._id
            })
            .then(user => {
                if (user) {
                    req.user = user;
                    next()
                } else {
                    res.send('User does not exist')
                }
            })
            .catch(err => {
                res.send('error: ' + err)
            })
    })

}

module.exports = { decode }