const express = require('express')
require('dotenv').config()
const db = require('../models')
const router = express.Router()

router.get('/songs', async function(req,res){
    try{
        if(res.locals.user){
        const findUser = await db.user.findByPk(res.locals.user.id)
        const findPlaylists = await findUser.getPlaylists()
        let allSongs =[]
        let songs
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
    }else{
        res.send('loggin first')
    }
    }catch(error){
        res.send('You messed up in the get /playlists/songs' + error) 
    }
})
                     //==READS SPECIFIC USERS PLAYLIST==\\
    router.get('/:id', async function(req,res){
        try{
            
            const findPlaylist = await db.playlist.findOne({
                where:{
                    id: parseInt(req.params.id)
                }
            })
            if(findPlaylist.status||findPlaylist.userId == res.locals.user.id){
                const songs = await findPlaylist.getSongs()
                let owner
                findPlaylist.userId == res.locals.user.id ? owner = true: owner = false
                res.render('playlistsongs.ejs',{
                    playlist: findPlaylist,
                    songs: songs,
                    auth: owner
                })
            }else{
                // if(res.locals.user){
                //     findPlaylist.userId == res.locals.user.id

                // }else{
                    res.send('you do not have permissio to veiw this playist')
                //}
            }

            // const findPlaylist = await db.playlist.findOne({
            //     where:{
            //       userId: parseInt(res.locals.user.id),
            //       name: req.params.id
            //     }
            // })
        }catch(error){
           // console.log(error)
           res.send('You messed up in the get /playlists/:id' + error) 
        }
    })
                        //====CREATES A USERS PLAYLIST====\\
    router.post('/', async function(req,res){
        try{
            let public 
            req.body.status=='public'? public = true: public =false
            const findPlaylist = await db.playlist.findOne({
                where:{
                    userId: res.locals.user.id,
                    name: req.body.newPlaylist
                }
            })
            //res.send(findPlaylist.status)
            if(findPlaylist){
                res.send('you already have a playlist with that name')
            }else{
                const createPlaylist = await db.playlist.create({
                    userId: res.locals.user.id,
                    name:req.body.newPlaylist,
                    status: public
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