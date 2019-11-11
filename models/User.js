const mongoose = require('mongoose')
const bcrypt = require('bcrypt')

// Create Schema
const UserSchema = new mongoose.Schema({
    first_name: {
        type: String
    },
    last_name: {
        type: String
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        required: true
    },
    created_at: {
        type: Date,
        default: Date.now
    },
    updated_at: {
        type: Date,
        default: Date.now
    },
    mobile_number: {
        type: Number,
        maxlength: 10,
        required: false
    },
    imgUrl: {
        type: String,
        required: false
    },
    resetPasswordToken: String,
    resetPasswordExpires: Date
})


UserSchema.pre('save', async function(next) {
    try {
        const salt = await bcrypt.genSalt(10);

        const passwordHash = await bcrypt.hash(this.password, salt);
        this.password = passwordHash;
        next()
    } catch (error) {
        next(error)
    }
})

UserSchema.methods.comparePassword = function(candidatePassword, cb) {
    bcrypt.compare(candidatePassword, this.password, function(err, isMatch) {
        if (err) return cb(err);
        cb(null, isMatch);
    });
};

module.exports = User = mongoose.model('users', UserSchema)