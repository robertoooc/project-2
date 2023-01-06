const express = require('express')
require('dotenv').config()
const axios = require('axios')
const db = require('../models')
const router = express.Router()
const Sequelize = require("sequelize");
const API_KEY =process.env.API_KEY
const OTHER_KEY =process.env.OTHER_KEY

router.get('/', async function(req,res){
try{
    let path
if(req.query.searchFor == 'songs'){
    path = 'songs?search='
}else if(req.query.searchFor == 'artists'){
    path = 'artists?search2='
}else{
    path = 'playlists?searchplaylists='
}
res.redirect(`/search/${path}${req.query.searchBy}`)
}catch(error){
    res.send('messed up in the get /search  ' + error)
}

})
router.get('/playlists', async function(req,res){
    try{
        let Op = Sequelize.Op;
        let findOtherPlaylists = await db.playlist.findAll({
            where:{
                name:{[Op.iLike]: `%${req.query.searchplaylists}%`},
                status: true
            },
            include: {
                model: db.user
            }
        })
        //res.send(findOtherPlaylists)
        res.render('otherplaylist.ejs',{
            playlists: findOtherPlaylists
        })
    }catch(error){
        res.send('You messed up in the get /users/playlists route' + error)  
    }
})

//==READS LIST OF SONGS FROM SEARCH==\\
router.get('/songs', async function(req,res){
    try{
        const response = await axios.get(`https://api.musixmatch.com/ws/1.1/track.search?q_track=${req.query.search}&s_track_rating=desc&f_has_lyrics=1&apikey=${API_KEY}`)
        res.render('lists.ejs',{
            search: response.data.message.body.track_list,
            name: req.query.search,
            searchSongs: true
        })
        }catch(error){
            // console.log('You messed up in the /users/songs route')
            res.send('You messed up in the /users/songs route' + error)
        }
    })
    
    router.get('/artists', async function(req,res){
        try{
        if(req.query.search2 == undefined){
            res.redirect('/')
        }
        const response = await axios.get(`https://api.musixmatch.com/ws/1.1/artist.search?q_artist=${req.query.search2}&page_size=15&apikey=${API_KEY}`)
        res.render('lists.ejs',{
            search: response.data.message.body.artist_list,
            name: req.query.search2,
            artistSearch: true
        })
    }catch(error){
        res.send('You messed up in the /users/artists route' + error)
    }
})

router.get('/artists/:id', async function(req,res){
    try{
        const response = await axios.get(`https://api.musixmatch.com/ws/1.1/artist.albums.get?artist_id=${req.params.id}&page_size=100&s_album_rating=desc&g_album_name=1&apikey=${API_KEY}`)
        //res.send(response.data)
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
         
         res.render('album.ejs',{
             tracks:response.data.message.body.track_list
            })  
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

const path = require('path')
router.use(express.static(path.join(__dirname, 'public')))
module.exports = router