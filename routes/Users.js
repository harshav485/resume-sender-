const express = require('express')
const users = express.Router()
const cors = require('cors')
const jwt = require('jsonwebtoken')
const User = require('../models/User')
var nodemailer = require('nodemailer');

const { decode } = require('./Auth')
users.use(cors())
const mongoose = require('mongoose')
const Expenses = require('../models/all-expense')
const passport = require('passport')
var nodemailer = require('nodemailer')
var async = require('async');
var crypto = require('crypto');
var LocalStrategy = require('passport-local').Strategy;


users.use(passport.initialize());
users.use(passport.session());


process.env.SECRET_KEY = 'secret'


users.post('/register', (req, res) => {

    const today = new Date()
    const userData = {
        first_name: req.body.first_name,
        last_name: req.body.last_name,
        email: req.body.email,
        password: req.body.password,
        created_at: today.toUTCString(),
        updated_at: today.toUTCString(),
        mobile_number: req.body.mobile_number,
        imgUrl: req.body.imgUrl

    }

    User.findOne({
            email: req.body.email
        })
        .then(user => {
            if (!user) {
                User.create(userData)
                    .then(user => {
                        const payload = {
                            _id: user._id,
                            first_name: user.first_name,
                            last_name: user.last_name,
                            email: user.email
                        }
                        let token = jwt.sign(payload, process.env.SECRET_KEY, {
                            expiresIn: 14400
                        })
                        res.json({ token: token })
                        console.log(userData)

                    })
                    .catch(err => {
                        res.send('error: ' + err)
                    })
            } else {
                res.json({ error: 'User already exists' })
            }
        })
        .catch(err => {
            res.send('error: ' + err)
        })
})

users.post('/login', (req, res) => {
    User.findOne({
            email: req.body.email
        })
        .then(user => {
            if (user) {
                const payload = {
                    _id: user._id,
                    first_name: user.first_name,
                    last_name: user.last_name,
                    email: user.email
                }
                let token = jwt.sign(payload, process.env.SECRET_KEY, {
                    expiresIn: 1440
                })
                res.json({ token: token })
            } else {
                res.json({ error: 'User does not exist' })
            }
        })
        .catch(err => {
            res.send('error: ' + err)
        })
})

passport.use(new LocalStrategy(function(email, password, done) {
    User.findOne({ email: email }, function(err, user) {
        if (err) return done(err);
        if (!user) return done(null, false, { message: 'Incorrect username.' });
        user.comparePassword(password, function(err, isMatch) {
            if (isMatch) {
                return done(null, user);
            } else {
                return done(null, false, { message: 'Incorrect password.' });
            }
        });
    });
}));

passport.serializeUser(function(user, done) {
    done(null, user.id);
});

passport.deserializeUser(function(id, done) {
    User.findById(id, function(err, user) {
        done(err, user);
    });
});

// users.get('/forgot', function(req, res) {
//     res.render('forgot', {
//         user: req.user
//     });
// });

users.post('/forgot', function(req, res, next) {
    async.waterfall([
        function(done) {
            crypto.randomBytes(20, function(err, buf) {
                var token = buf.toString('hex');
                done(err, token);
            });
        },
        function(token, done) {
            User.findOne({ email: req.body.email }, function(err, user) {
                if (!user) {
                    req.flash('error', 'No account with that email address exists.');
                    return res.redirect('/forgot');
                }

                user.resetPasswordToken = token;
                user.resetPasswordExpires = Date.now() + 3600000; // 1 hour

                user.save(function(err) {
                    done(err, token, user);
                });
            });
        },
        function(token, user, done) {
            var smtpTransport = nodemailer.createTransport('SMTP', {
                service: 'SendGrid',
                auth: {
                    user: '!!! YOUR SENDGRID USERNAME !!!',
                    pass: '!!! YOUR SENDGRID PASSWORD !!!'
                }
            });
            var mailOptions = {
                to: user.email,
                from: 'passwordreset@demo.com',
                subject: 'Node.js Password Reset',
                text: 'You are receiving this because you (or someone else) have requested the reset of the password for your account.\n\n' +
                    'Please click on the following link, or paste this into your browser to complete the process:\n\n' +
                    'http://' + req.headers.host + '/reset/' + token + '\n\n' +
                    'If you did not request this, please ignore this email and your password will remain unchanged.\n'
            };
            smtpTransport.sendMail(mailOptions, function(err) {
                req.flash('info', 'An e-mail has been sent to ' + user.email + ' with further instructions.');
                done(err, 'done');
            });
        }
    ], function(err) {
        if (err) return next(err);
        res.redirect('/forgot');
    });
});

users.get('/profile', (req, res) => {
    var decoded = jwt.verify(req.headers['authorization'], process.env.SECRET_KEY)

    User.findOne({
            _id: decoded._id
        })
        .then(user => {
            if (user) {
                res.json(user)
            } else {
                res.send('User does not exist')
            }
        })
        .catch(err => {
            res.send('error: ' + err)
        })
})

users.get('/expenses', decode, function(req, res, next) {
    Expenses.find()
        .then(docs => {
            res.status(200).json(docs);
        }).catch(err => {
            res.status(500).json({
                error: err
            })
        })
})

users.post('/expenses', decode, (req, res, next) => {
    const expense = new Expenses({
        email: req.body._id,
        Description: req.body.Description,
        amount: req.body.amount
    });
    expense.save(function(error) {
        if (!error) {
            User.find({})
                .populate('email')
                .populate('Description')
                .populate('amount')
            res.status(500).json({})

        } else {
            res.send('error')
        }
    })
})

users.put("/:expenseId", decode, (req, res, next) => {
    Expenses.update({ _id: req.params.expenseId })
        .exec()
        .then(result => {
            res.status(200).json({
                message: "expense deleted",

            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});


users.delete("/:expenseId", decode, (req, res, next) => {
    Expenses.remove({ _id: req.params.expenseId })
        .exec()
        .then(result => {
            res.status(200).json({
                message: "expense deleted",

            });
        })
        .catch(err => {
            res.status(500).json({
                error: err
            });
        });
});

users.get('/:expenseId', decode, (req, res, next) => {
    res.status(200).json({
        message: 'expense details',
        expenseId: req.params.expenseId
    });
});

module.exports = users