// create an instance of express routers
const express = require('express')
const db = require('../models')
const router = express.Router()

// mount our routes on the router

// GET /users/new --serves a form to create a new user
router.get('/new',function(req,res){
    res.render('users/new.ejs',{user: res.locals.user})
})

// POST /users -- creates a new user from the form @ /users/new
router.post('/',async function(req,res){
    try{
        //based on the info in the req.body, find or create user
        const [newUser,created] = await db.user.findOrCreate({
            where:{
                email: req.body.email
            },
            //looks for emails first
            // TODO: don't add plaintext passwords to the db
            defaults: {
                password: req.body.password
            }
            //creates a password from the form doesn't matter if it's not unique unlike email
        })
        // TODO: redirect to the login page if the user is found
        // log the user in (store the user's id ad a cookie in the browser)
        res.cookie('userId', newUser.id)
        // redirect to the homepage for the user
        res.redirect('/users/profile')

    }catch(error){
        console.log(err)
        res.status(500).send('server error')
    }
})

// GET /users/login -- render a login form that POSTs to /users/login
router.get('/login',function(req,res){
    res.render('users/login.ejs',{
        message: req.query.message ? req.query.message : null,
        user: res.locals.user
    })
})

// POST /users/login -- ingest data from form rendered @ GET /users/login
router.post('/login',async function(req,res){
    try{
        // look up the user based on their email
        const user = await db.user.findOne({
            where:{
                email: req.body.email
            }
        })
        //boilerplate message if login fails
        const badCredentialMessage ='username or password incorrect'
        if(!user){
            // if the user isn't found in the db
            res.redirect('/users/login?message' +badCredentialMessage)

        } else if(user.password !== req.body.password){
            // if the user's supplied password is incorrect
            res.redirect('/users/login?message' +badCredentialMessage)
        } else{
            // if the user is found and their password matches log them in
            console.log('loggin user in!')
            res.cookie('userId', user.id)
            res.redirect('/users/profile')
        }
    }catch(error){
        console.log(err)
        res.status(500).send('server error') 
    }
})

// GET /users/logout --clear any cookies and redirect to the homepage
router.get('/logout',function(req,res){
    //log the user out by clearing the cookies
    res.clearCookie('userId')
    res.redirect('/')
})

// GET /users/profile -- show the user their profile page
router.get('/profile',function(req,res){
    // if the user is not logged in -- they are not allowed to be here
    if(!res.locals.user){
        res.redirect('/users/login?message=You must authenticate before you are authorized to view this resource')
    } else{
        res.render('users/profile.ejs',{
            user: res.locals.user
        })
    }
})
// export the router
module.exports= router