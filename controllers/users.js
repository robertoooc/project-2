// create an instance of express routers
const express = require('express')
require('dotenv').config()
const db = require('../models')
const router = express.Router()
const crypto = require('crypto-js')
const bcrypt = require('bcrypt')
const axios = require('axios')
const API_KEY =process.env.API_KEY
const OTHER_KEY =process.env.OTHER_KEY
// mount our routes on the router

// GET /users/new -- serves a form to create a new user
router.get('/new', function (req, res) {
    res.render('users/new.ejs', {
        user: res.locals.user
    })
})

// POST /users -- creates a new user from the form @ /users/new
router.post('/', async function (req, res) {
    try {
        // based on the info in the req.body, find or create user
        const [newUser, created] = await db.user.findOrCreate({
            where: {
                email: req.body.email
            }
        }) 
        // if the user is found, redirect user to login
        if (!created) {
            //console.log('user exists!')
            res.redirect('/users/login?message=Please log in to continue.')
        } else {
            // here we know its a new user
            // hash the supplied password
            const hashedPassword = bcrypt.hashSync(req.body.password, 12)
            // save the user with the new password
            newUser.password = hashedPassword
            await newUser.save() // actually save the new password in th db
            // ecrypt the new user's id and convert it to a string
            const encryptedId = crypto.AES.encrypt(String(newUser.id), process.env.SECRET)
            const encryptedIdString = encryptedId.toString()
            // place the encrypted id in a cookie
            res.cookie('userId', encryptedIdString)
            // redirect to user's profile
            res.redirect('/users/profile')
        }

    } catch (err) {
        //console.log(err)
        res.status(500).send('server error')
    }
})

// GET /users/login -- render a login form that POSTs to /users/login
router.get('/login', function (req, res) {
    res.render('users/login.ejs', {
        message: req.query.message ? req.query.message : null,
        user: res.locals.user
    })
})

// POST /users/login -- ingest data from form rendered @ GET /users/login
router.post('/login', async function (req, res) {
    try {
        // look up the user based on their email
        const user = await db.user.findOne({
            where: {
                email: req.body.email
            }
        })
        // boilerplate message if login fails
        const badCredentialMessage = 'username or password incorrect'
        if (!user) {
            // if the user isn't found in the db 
            res.redirect('/users/login?message=' + badCredentialMessage)
        } else if (!bcrypt.compareSync(req.body.password, user.password)) {
            // if the user's supplied password is incorrect
            res.redirect('/users/login?message=' + badCredentialMessage)
        } else {
            // if the user is found and their password matches log them in
            //console.log('loggin user in!')
            const encryptedId = crypto.AES.encrypt(String(user.id), process.env.SECRET)
            const encryptedIdString = encryptedId.toString()
            // place the encrypted id in a cookie
            res.cookie('userId', encryptedIdString)
            res.redirect('/users/profile')
        }
    } catch (err) {
        //console.log(err)
        res.status(500).send('server error')
    }
})

// GET /users/logout -- clear any cookies and redirect to the homepage
router.get('/logout', function (req, res) {
    // log the user out by removing the cookie
    // make a get req to /
    res.clearCookie('userId')
    res.redirect('/')
})

// GET /users/profile -- show the user their profile page
                    //==SHOWS LIST OF PLAYLISTS USER HAS==\\
router.get('/profile', async function (req, res) {
    // if the user is not logged in -- they are not allowed to be here
    try{
        if (!res.locals.user) {
            res.redirect('/users/login?message=You must authenticate before you are authorized to view this resource!')
        } else {
            const findPlaylists = await db.playlist.findAll({
                where:{
                    userId: parseInt(res.locals.user.id)
                }
            }) 
            res.render('users/profile.ejs', {
                user: res.locals.user,
                playlists: findPlaylists
            })
        }
    }catch(error){
        res.send('you messed up in get /users/profile'+ error)
    }
})
                    //==READS LIST OF SONGS FROM SEARCH==\\
 router.get('/songs', async function(req,res){
    try{
        const response = await axios.get(`https://api.musixmatch.com/ws/1.1/track.search?q_track=${req.query.search}&s_track_rating=desc&f_has_lyrics=1&apikey=${API_KEY}`)
        res.render('search.ejs',{
            search: response.data.message.body.track_list,
            name: req.query.search})
    }catch(error){
       // console.log('You messed up in the /users/songs route')
        res.send('You messed up in the /users/songs route' + error)
    }
 })
 router.get('/artists', async function(req,res){
    try{
        const response = await axios.get(`https://api.musixmatch.com/ws/1.1/artist.search?q_artist=${req.query.search2}&page_size=15&apikey=${API_KEY}`)
        res.render('artistsearch.ejs',{
            search: response.data.message.body.artist_list,
            name: req.query.search2
        })
    }catch(error){
        res.send('You messed up in the /users/artists route' + error)
    }
 }) 
 router.get('/artists/:id', async function(req,res){
    try{
        const response = await axios.get(`https://api.musixmatch.com/ws/1.1/artist.albums.get?artist_id=${req.params.id}&page_size=100&s_album_rating=desc&g_album_name=1&apikey=${API_KEY}`)
        res.send(response.data)
        res.render('album.ejs',{
            albums: response.data.message.body.album_list
        })
    }catch(error){
        res.send('You messed up in the /users/artists/id route' + error)  
    }
 })
router.get('/albums/:id', async function(req,res){
    try{
        const response = await axios.get(`https://api.musixmatch.com/ws/1.1/album.tracks.get?album_id=${req.params.id}&f_has_lyrics=1&page=1&page_size=25&apikey=${API_KEY}`)
        res.send(response.data)  
    }catch(error){
        res.send('You messed up in the /users/albums/id route' + error)
    }
})
                     //==READS SPECIFIC SONG==\\
 router.get('/songs/:id', async function(req,res){
    try{
        const response = await axios.get(`https://api.musixmatch.com/ws/1.1/track.get?commontrack_id=${req.params.id}&f_has_lyrics=1&apikey=${API_KEY}`)
        let lyrics
        if(response.data.message.body.track.has_lyrics == '1'){
             lyrics = await axios.get(`https://api.musixmatch.com/ws/1.1/track.lyrics.get?commontrack_id=${req.params.id}&apikey=${API_KEY}`)
             lyrics = lyrics.data.message.body.lyrics

            } else{ lyrics = false}
            let findUserPlaylist
            if (res.locals.user){
                 findUserPlaylist= await db.playlist.findAll({
                    where:{
                        userId: res.locals.user.id
                    }
                })
            }else{
                findUserPlaylist= false
            }
        let str =response.data.message.body.track.artist_name
        //str = str.toLowerCase()
        let check = `feat.`
        if(str.includes(check)){
            let cutOff = str.indexOf(check) - 1
            str = str.slice(0,cutOff)
        }
        let alb = response.data.message.body.track.album_name
        alb = alb.toLowerCase()
        let check2 = `- single`
        if(alb.includes(check2)){
            let cutOfff = alb.indexOf(check2) - 1
            alb = alb.slice(0,cutOfff)
        }
            const img = await axios.get(`http://ws.audioscrobbler.com/2.0/?method=album.getinfo&api_key=${OTHER_KEY}&artist=${str}&album=${alb}&format=json`)
            let src = img.data.album.image[4]
                src['img'] =src['#text']
                if(src.img == ''){
                src.img='https://www.pbpusa.org/Shared/img/notfound.png'
                }
        res.render('searchSpecific.ejs',{
            song: response.data.message.body.track,    
            lyrics:lyrics,
            playlists: findUserPlaylist,
            img: src
    })
    } catch(error){
        console.log(error+'🐥🐥🐥🐥🐥')
        res.send('you messed up in the users/songs/:id get route'+error)
    }
 })
                     //==ADDS SONG TO SPECIFIC PLAYLIST==\\
 router.post('/songs/:id', async function(req,res){
    try{
     if(res.locals.user != null){
        const response = await axios.get(`https://api.musixmatch.com/ws/1.1/track.get?commontrack_id=${req.params.id}&f_has_lyrics=1&apikey=${API_KEY}`)
        const findPlaylist = await db.playlist.findOne({
            where:{
                userId: res.locals.user.id,
                name: req.body.playlist
            }
        })
        const [findSong,created] = await db.song.findOrCreate({
            where:{
                track: parseInt(req.params.id),
                name: response.data.message.body.track.track_name,
                artist: response.data.message.body.track.artist_name
            }    
        })
        await findPlaylist.addSong(findSong)
         res.redirect('/users/profile')

     } else{
       res.send('login to an account first') 
     } 
    }catch(error){
       // console.log(req.params.id)
        res.send('you messed up in the users/songs/:id post route'+ error)
    }
 })
// export the router
module.exports = router