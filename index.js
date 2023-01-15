// required packages
require('dotenv').config()
const express = require('express')
const methodOverride = require('method-override')
const cookieParser = require('cookie-parser')
const db = require('./models')
const crypto = require('crypto-js')
const axios = require('axios')
const API_KEY =process.env.API_KEY
const OTHER_KEY =process.env.OTHER_KEY
// app config
const app = express()
app.use(methodOverride('_method'))
const PORT = process.env.PORT || 8000
app.set('view engine', 'ejs')
// parse request bodies from html forms
app.use(express.urlencoded({ extended: false }))
// tell express to parse incoming cookies
app.use(cookieParser())
// custom auth middleware that checks the cookies for a user id
// and it finds one, look up the user in the db
// tell all downstream routes about this user
app.use(async (req, res, next) => {
    try {
        if (req.cookies.userId) {
            // decrypt the user id and turn it into a string
            const decryptedId = crypto.AES.decrypt(req.cookies.userId, process.env.SECRET)
            const decryptedString = decryptedId.toString(crypto.enc.Utf8)
            // the user is logged in, lets find them in the db
            const user = await db.user.findByPk(decryptedString)
            // mount the logged in user on the res.locals
            res.locals.user = user
        } else {
            // set the logged in user to be null for conditional rendering
            res.locals.user = null
        }
        
        // move on the the next middleware/route
        next()
    } catch (err) {
        console.log('error in auth middleware: 🔥🔥🔥🔥', err)
        // explicity set user to null if there is an error
        res.locals.user = null
        next() // go to the next thing
    }
})

// example custom middleware (incoming request logger)
app.use((req, res, next) => {
    // our code goes here
    // console.log('hello from inside of the middleware!')
    console.log(`incoming request: ${req.method} - ${req.url}`)
    // res.locals are a place that we can put data to share with 'downstream routes'
    // res.locals.myData = 'hello I am data'
    // invoke next to tell express to go to the next route or middle
    next()
})

// routes and controllers
app.get('/', async function(req, res) {    
    try{
        const search = await axios.get(`https://api.musixmatch.com/ws/1.1/chart.tracks.get?chart_name=mxmweekly&page=1&page_size=15&f_has_lyrics=1&apikey=${API_KEY}`)
        let findPubPlaylist = await db.playlist.findAll({
            where:{
                status: true
            },
            include:{
                model:db.user
            }
        })
        let topFive
         let countTrack=[]
        if(findPubPlaylist.length>5){
            for(let i in findPubPlaylist){
                const count = await db.activity.findAll({
                    where:{
                        playlistId: findPubPlaylist[i].id
                    }
                })
                // console.log(count.length,findPubPlaylist[i].name,findPubPlaylist[i].id,i , '🤑🤑🤑🤑')
                let track = count.length
                let id = findPubPlaylist[i]
                countTrack.push({
                    count: track,
                    playlistId: id
                })
            }
            topFive = countTrack.sort((p1, p2) => (p1.count < p2.count) ? 1 : (p1.count > p2.count) ? -1 : 0)
            console.log(topFive, '🐳')
            findPubPlaylist = topFive
        }
        console.log('top55',countTrack)
        res.render('home.ejs', {
            user: res.locals.user,
            publicPlaylists: findPubPlaylist
            ,
            popSongs: search.data.message.body.track_list
        })
    }catch(error){
        res.send('error in main page'+error)
    }
})

 app.use('/users', require('./controllers/users'))
 app.use('/playlists', require('./controllers/playlists'))
 app.use('/search', require('./controllers/search'))
const path = require('path')
app.use(express.static(path.join(__dirname, 'public')))

app.get('*', function(req,res){
    // res.sendFile(__dirname + 'error.ejs')
    res.render('error.ejs')
})
// listen on a port
app.listen(PORT, () => {
    console.log(`authenticating users on PORT ${PORT} 🔐`)
})