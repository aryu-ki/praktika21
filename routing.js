const bcrypt = require('bcryptjs')
const User = require('./models/User')
const Query = require('./models/Query')
const cookieParser = require('cookie-parser')()
const bodyParser = require('body-parser').urlencoded({ extended: false })
require('dotenv').config()
const jwt = require('jsonwebtoken')

class Routes {
    static init(app, express) {
        Routes.app = app
        Routes.express = express
        Routes.authRouter = new express.Router()
        Routes.directionLookup = new express.Router()
        Routes.initRoutes()
    }

    static initMidlleware() {
        Routes.app.use(cookieParser)
        Routes.app.use(bodyParser)
        Routes.app.use(Routes.authCheck)
        // app.use(routes.refreshToken)
    }

    static transmitRequest(req, res, next) {
        next()
    }

    static initAuthRouter() {
        Routes.authRouter.get('/login', Routes.loginRender)
        Routes.authRouter.get('/signup', Routes.signupRender)
        Routes.authRouter.post('/login', Routes.login)
        Routes.authRouter.post('/signup', Routes.signup)
        Routes.authRouter.get('/clear', Routes.clearDB)
        Routes.authRouter.get('/users', Routes.printUsers, (req, res) =>
            res.json({ abba: 'ahahah' })
        )
        Routes.app.use(Routes.authRouter, Routes.transmitRequest)
    }
    static initMainRouter() {
        Routes.directionLookup.get('/', Routes.landingRender)
        Routes.directionLookup.get('/search', Routes.searchRender)
        Routes.directionLookup.post('/search', Routes.saveQuery)
        Routes.app.use(Routes.directionLookup, Routes.transmitRequest)
    }

    static initRoutes() {
        Routes.app.use(Routes.express.static('public'))
        Routes.initMidlleware()
        Routes.initAuthRouter()
        Routes.initMainRouter()
        Routes.app.use(Routes.notFound) // No handler processed the request makes it a 404 case
    }

    static files(req, res, next) {
        res.sendFile(__dirname + req.url)
    }
    static signupRender(req, res) {
        let options = {
            layout: 'auth',
        }
        res.render('signup', options)
    }
    static loginRender(req, res) {
        let options = { title: 'Login', layout: 'auth.hbs' }
        res.render('login', options)
    }
    static landingRender(req, res) {
        let options = {
            cssPath: 'styles/mainstyle.css',
            titlestring: 'Where to go',
        }
        if (req.username) options.username = req.username
        res.render('landing', options)
    }
    static notFound(req, res, next) {
        let error = {
            errorcode: 404,
            errorstring: "We couldn't find page you were looking for",
        }
        res.render('error', error)
    }
    static searchRender(req, res) {
        let options = {
            cssPath: 'styles/querystyle.css',
            scriptPath: 'scripts/searchpage.js',
            queries: User.findOne({ username: req.username })?.queries,
        }
        if (req.username) options.username = req.username
        res.render('query', options)
    }

    // Processors
    static saveQuery(req, res) {
        console.log(Object.values(req.body))
        let query = new Query({
            name: req.body.queryname,
            destination: req.body.querydest,
        })
        query.save()
        User.updateOne(
            { username: req.username },
            { $push: { queries: query } },
            (err, user) => {
                if (err) console.log(err)
                /* 
                res.setHeader('Content-type', 'application/json') */
                res.json(user)
            }
        )
    }

    static validateBody(req) {
        return req.body && req.body.username && req.body.password
    }

    static getdirection(req, res) {}
    static async login(req, res) {
        if (!Routes.validateBody(req))
            return Routes.badRequestRedirect(res, '/login')
        let user = await Routes.findUser(req.body.username)
        if (!user) return Routes.badRequestRedirect(res, '/login')
        let passwordCorrect = await Routes.hashCompare(
            req.body.password,
            user.password
        )
        if (passwordCorrect) {
            let token = Routes.jwtsign(req.body.username, false, {
                expiresIn: '20s',
            })
            let refreshToken = Routes.jwtsign(req.body.username, true)
            Routes.authRedirect(res, token, refreshToken)
        } else {
            return Routes.badRequestRedirect(res, '/login')
        }
    }

    static clearDB(req, res) {
        Routes.clearUsers()
        res.send('Users deleted')
    }

    static async clearUsers() {
        await User.deleteMany({})
    }

    static findUser(username) {
        return User.findOne({ username: username })
    }

    static authRedirect(res, token, refreshToken, post = false) {
        res.cookie('access_token', `${token}`, { httpOnly: true })
        res.cookie('refresh_token', `${refreshToken}`, { httpOnly: true })
        res.redirect('/search')
    }

    static jwtsign(data, refresh = false, options = {}) {
        let secret = refresh
            ? process.env.REFRESH_TOKEN_SECRET
            : process.env.ACCESS_TOKEN_SECRET
        data = {
            username: data,
        }
        return jwt.sign(data, secret, options)
    }

    static async jwtverify(token, refresh = false) {
        let secret = refresh
            ? process.env.REFRESH_TOKEN_SECRET
            : process.env.ACCESS_TOKEN_SECRET
        return jwt.verify(token, secret)
    }

    static hashCompare(prompt, data) {
        return bcrypt.compare(prompt, data)
    }

    static createUser(username, password, email) {
        new User({
            username: username,
            password: password,
            email: email,
        }).save()
    }

    static userExistsRedirect(res, adress) {
        res.status(409).redirect(adress)
    }

    static printUsers() {
        User.find({})
            .lean()
            .exec((err, docs) => {
                for (let doc of docs) {
                    console.log(doc)
                }
            })
        Query.find({})
            .lean()
            .exec((err, docs) => {
                for (let doc of docs) {
                    console.log(doc)
                }
            })
    }

    static badRequestRedirect(res, adress) {
        res.status(403).redirect(adress)
    }

    static signup(req, res) {
        if (req.body == null) return Routes.badRequestRedirect(res, '/signup')
        try {
            Routes.createUser(
                req.body.username,
                req.body.password,
                req.body.email
            )
            let token = Routes.jwtsign(req.body.username)
            let refreshToken = Routes.jwtsign(req.body.username, true)
            Routes.authRedirect(res, token, refreshToken)
        } catch (validationError) {
            console.log(validationError)
            Routes.userExistsRedirect(res, '/signup')
        }
    }

    static async authCheck(req, res, next) {
        let user
        let token = req.cookies?.access_token
        try {
            user = await Routes.jwtverify(token)
            req.username = user.username
            next()
            return
        } catch (tokenInvalid) {
            try {
                user = await Routes.jwtverify(req.cookies?.refresh_token, true)
                token = Routes.jwtsign(user.username, false, {
                    expiresIn: '20s',
                })
                res.cookie('access_token', token)
                res.redirect(req.url)
                return
            } catch (refreshTokenInvalid) {
                res.clearCookie('access_token')
                res.clearCookie('refresh_token')
                next()
                return
            }
        }
    }
}

module.exports = Routes
