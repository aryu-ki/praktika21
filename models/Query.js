const mongoose = require('mongoose')
const Schema = mongoose.Schema

const Query = new Schema({
    name: {
        type: String,
        required: true,
        unique: true,
    },
    destination: {
        type: String,
        required: true,
    },
    request: {
        type: String,
    },
})

module.exports = mongoose.model('query', Query)
