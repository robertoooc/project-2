const express = require('express')
require('dotenv').config()
const db = require('../models')
const router = express.Router()

router.get('/songs', async function(req,res){
    try{
        // const findPlaylist = await db.playlist.findAll({
        //     where:{
        //       userId: parseInt(res.locals.user.id)
        //     }
        // })
        const findUser = await db.user.findByPk(res.locals.user.id)
        const findPlaylists = await findUser.getPlaylists()
        let allSongs =[]
        let songs
        let copy = false
        for(let i =0; i < findPlaylists.length; i++){
           songs = await findPlaylists[i].getSongs()
           for(let j =0; j < songs.length;j++){
            allSongs.push(songs[j])
           }
        }
        const newArr = allSongs.map((song) => [song.id, song]);
        const newMap = new Map(newArr);
        const iterator = newMap.values();
        const unique = [...iterator]
    
        res.render('usersongs.ejs',{song: unique})
    }catch(error){
        res.send('You messed up in the get /playlists/songs' + error) 
    }
})
                     //==READS SPECIFIC USERS PLAYLIST==\\
    router.get('/:id', async function(req,res){
        try{
            const findPlaylist = await db.playlist.findOne({
                where:{
                  userId: parseInt(res.locals.user.id),
                  name: req.params.id
                }
            })
            const songs = await findPlaylist.getSongs()
            res.render('playlistsongs.ejs',{
                playlist: findPlaylist,
                songs: songs
            })
        }catch(error){
            console.log(error)
           res.send('You messed up in the get /playlists/:id' + error) 
        }
    })
                        //====CREATES A USERS PLAYLIST====\\
    router.post('/', async function(req,res){
        try{
            //const findUser = await db.user.findByPk(res.locals.user.id)
            const findPlaylist = await db.playlist.findOne({
                where:{
                    userId: res.locals.user.id,
                    name: req.body.newPlaylist
                }
            })
            if(findPlaylist){
                res.send('you already have a playlist with that name')
            }else{
                const createPlaylist = await db.playlist.create({
                    userId: res.locals.user.id,
                    name:req.body.newPlaylist
                })
                res.redirect('/users/profile')
            }
        }catch(error){
            res.send('you messed up in the post /playlist '+error)
        }
    })
                       //====RENAMES A USERS PLAYLIST====\\
    router.put('/', async function(req,res){
        try{
            const findName = await db.playlist.findOne({
                where:{
                    userId: res.locals.user.id,
                    name: req.body.newName
                }
            })
            const findPlaylist = await db.playlist.findOne({
                where:{
                    userId: res.locals.user.id,
                    name: req.body.playlist
                }
            }) 
            if(!findName){
                await findPlaylist.update({name: req.body.newName})
                res.redirect('/users/profile')
            }else{
                res.send('nooo')
            }
        }catch(error){
            res.send('you messed up in the put /playlist '+error)   
        }
    })
                    //====DELETES A USERS PLAYLIST====\\
    router.delete('/',async function(req,res){
        try{
            const findPlaylist = await db.playlist.destroy({
                where:{
                    userId: res.locals.user.id,
                    name: req.body.deletePlaylist
                }
            })
            res.redirect('/users/profile')
        }catch(error){
            res.send('you messed up in the delete /playlists ' +error)
        }
    })
                    //==REMOVES SONG FROM USERS PLAYLIST==\\
    router.delete('/:playlistName/songs/:songId', async function(req,res){
        try{
            const findPlaylist = await db.playlist.findOne({
                where:{
                    userId: res.locals.user.id,
                    name: req.params.playlistName
                }
            })
            const findSong = await db.song.findOne({
                where:{
                    track: req.params.songId
                }
            })
            await findPlaylist.removeSong(findSong)
            res.redirect('/users/profile')
        }catch(error){
            res.send('you messed up in the delete /playlist '+error)
        }
    })

module.exports = router