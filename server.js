// Этот файл будет отвечать за инициализацию роутера, сервера. Также, здесь будет выполняться основной скрипт

// requirements

const mongoose = require('mongoose')
// const mongodb = require('mongodb')
// const MongoClient = mongodb.MongoClient
// const mongoClient = new MongoClient('https')
const express = require('express')
const expresshbs = require('express-handlebars')
const hbs = require('hbs')
const app = express()
const Routes = new require('./routing')
const bodyParser = require('body-parser')
const cookieParser = require('cookie-parser')()
const urlEncoded = bodyParser.urlencoded({ extended: false })

// Initialization
let routes

let init = function () {
    initDB()
    Routes.init(app, express)
    initHbs()
    app.listen(process.env.PORT || 3000, () => {
        console.log('Started the server')
    })
}

let shutdown = function (reason) {
    console.log(reason)
    process.exit()
}

let initDB = async function () {
    try {
        let result = await mongoose.connect(
            'mongodb://localhost:27017/praktikadb',
            { useUnifiedTopology: false, useNewUrlParser: true }
        )
    } catch (err) {
        shutdown('Failed to start db.')
    }
}

let setEngineOptions = function () {
    app.set('view engine', 'hbs')
    app.engine(
        'hbs',
        expresshbs({
            defaultLayout: 'main',
            extname: 'hbs',
            layoutsDir: './views/layouts',
        })
    )
}

let initHbs = function () {
    setEngineOptions()
    hbs.registerPartials(__dirname + '/views/partials')
    hbs.registerPartials(__dirname + '/views')
}

init()
