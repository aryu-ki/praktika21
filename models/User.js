const bcrypt = require('bcryptjs')
const Query = require('./Query')
const mongoose = require('mongoose')
const Schema = mongoose.Schema

const User = new Schema({
    username: {
        type: String,
        unqiue: true,
        required: true,
    },
    email: {
        type: String,
        required: true,
        unique: true,
    },
    password: {
        type: String,
        required: true,
    },
    queries: [{ type: Schema.Types.ObjectId, rel: 'Query' }],
    avatar: {
        data: Buffer,
        contentType: String,
    },
})

User.pre('save', function (next) {
    const user = this
    if (user.isNew || user.isModified('password')) {
        bcrypt
            .hash(user.password, 6)
            .then(function (hash) {
                user.password = hash
                next()
            })
            .catch(e => {
                throw e
            })
    } else {
        next()
    }
})

module.exports = mongoose.model('user', User)
