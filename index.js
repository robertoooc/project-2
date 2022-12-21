//required packages
require('dotenv').config
const express = require('express')
const cookieParser = require('cookie-parser')
const db = require('./models')
//app config
const app = express()
const PORT = process.env.PORT || 8000
app.set('view engine','ejs')
// parse request bodies from html forms
// allows req.body to exist
app.use(express.urlencoded({extended: false}))
// tell express to parse incoming cookes
app.use(cookieParser())

// custom auth middleware that checks the cookies for a user id
// and it finds one, look up the user in the db
// tell all downstream routes about this user
app.use(async function(req,res,next){
    try{
        if(req.cookies.userId){
            // the user is logged in, let's find them in the db
            const user = await db.user.findByPk(req.cookies.userId)
            // mount the logged in user on the res.locals
            res.locals.user = user
        } else{
            // set the logged in user to be null for conditional rendering
            res.locals.user = null
        }
        // move on the next middleware/route
        next()
    }catch(error){
        console.log('error in aut middleware 🔥')
        next() // go to the next thing
    }
})

// example custom middleware (incoming request logger)
app.use(function(req,res,next){
    // our code goes here
    //console.log('hellow from inside of the middleware')
    console.log(`incoming request: ${req.method} - ${req.url}`)
    // res.locals are a place that we can put data to share with downstream routes
    //res.locals.myData = 'hello I am data'
    // invoke next to tell express to go to the next route or middle
    next()
})

//routes and controllers
app.get('/',function(req,res){
    //console.log(res.locals)
    res.render('home.ejs',{
        user: res.locals.user
    })
})
app.use('/users',require('./controllers/users'))

//listen on a port
app.listen(PORT,function(){
    console.log(`authenticating users on PORT ${PORT}`)
})