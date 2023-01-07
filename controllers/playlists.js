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
    
    res.render('lists.ejs',{song: unique, userSongs: true,
    searchBy: 'userSongs'})
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
            const findAll = await db.activity.findAll({
                where:{
                    playlistId: findPlaylist.id
                },
                include:{
                    model: db.user
                }
            })
            let findLikes,likeCount,findComments
            findLikes = findAll.filter(activity => activity.like == true)
            likeCount = findLikes.length
            findComments = findAll.filter(activity => activity.comment != null)
            let view, owner, userLike, userComments
            if(findPlaylist == null){
                res.send('does not exist')
            }else{
                const songs = await findPlaylist.getSongs()
                findPlaylist.status ? view = true: view = false
                if(res.locals.user){
                    userLike = await db.activity.findOne({
                        where:{
                            playlistId: findPlaylist.id,
                            userId: res.locals.user.id,
                            like: true 
                        }
                    })
                    userComments = findComments.filter(comment => comment.userId == res.locals.user.id)
                    userLike != null ? userLike = true: userLike = false
                    
                findPlaylist.userId == res.locals.user.id ? owner= true: owner=false
            }else{
                owner = false
            }
            res.render('playlistsongs.ejs',{
                playlist: findPlaylist,
                songs: songs,
                owner: owner,
                view: view,
                likes: likeCount,
                comments: findComments,
                userLike: userLike,
                userComments: userComments
            })
        }
    }catch(error){
        console.log('🐙🐙🐙🐙🐙You messed up in the get /playlists/:id🐙🐙🐙🐙' + error) 
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
                    status: public,
                    likes: 0
                })
                res.redirect('/users/profile')
            }
        }catch(error){
            res.send('you messed up in the post /playlist '+error)
        }
    })
    router.post('/comments', async function(req,res){
        try{
            if(res.locals.user){
                const findPlaylist = await db.playlist.findOne({
                    where:{
                        id:req.body.playlistId  
                    }
                })
                const createComment = await db.activity.create({
                    userId: res.locals.user.id,
                    playlistId: findPlaylist.id,
                    comment: req.body.comment
                })
                res.redirect(`/playlists/${findPlaylist.id}`)
            }else{
                res.send('no can do')
            }
        }catch(error){
            res.send('you messed up in the post /playlist/comments '+error) 
        }
    })
    router.put('/comments', async function(req,res){
        try{
            const findComment = await db.activity.findByPk(req.body.commentId)
            await findComment.update({comment:`${req.body.updatedComment}`})
            res.redirect(`/playlists/${req.body.playlistId}`)
        }catch(error){
            res.send('you messed up in the put /playlists/comments '+ error)
        }
    })
    router.delete('/comments', async function(req,res){
        try{
            const findComment = await db.activity.destroy({
                where:{
                    id:req.body.commentId
                }
            })
            res.redirect(`/playlists/${req.body.playlistId}`)
        }catch(error){
            res.send('You messed up in the delete /playlist/comments'+ error)
        }
    })
    router.post('/likes', async function(req,res){
        try{
            if(res.locals.user){
                const findPlaylist = await db.playlist.findOne({
                    where:{
                        id:req.body.playlistId  
                    }
                })
                const [addLike,created] = await db.activity.findOrCreate({
                    where:{
                        userId: res.locals.user.id,
                        playlistId: findPlaylist.id,
                        like: true
                    }
                })
                const findAll = await db.activity.findAll({
                    where:{
                        playlistId: findPlaylist.id
                    }
                })
                const findLikes = findAll.filter(activity => activity.like == true)
                const findComments = findAll.filter(activity => activity.comment != null)
                const amount = await db.activity.count({
                    where:{
                        playlistId: findPlaylist.id,
                        like: true                        
                    }
                })
                res.redirect(`/playlists/${findPlaylist.id}`)
            }else{
                res.send('no can do')
            }
        }catch(error){
            res.send('you messed up in the post /playlist/likes '+error) 
        }
    })
    router.delete('/likes', async function(req,res){
        try{
            const findLike = await db.activity.destroy({
                where:{
                    playlistId: req.body.playlistId,
                    userId: res.locals.user.id,
                    like: true
                }
            })
            res.redirect(`/playlists/${req.body.playlistId}`)
        }catch(error){
            res.send('you messed up in the delete /playlist/likes '+error)
        }
    })
    //====RENAMES A USERS PLAYLIST====\\
    router.put('/', async function(req,res){
        try{
            if(req.body.like){
                res.send('clicked')
            }else{
                let name = req.body.newName
                let public 
                req.body.status=='public'? public = true: public =false
                const findPlaylist = await db.playlist.findOne({
                    where:{
                        userId: res.locals.user.id,
                        name: req.body.playlist
                    }
                }) 
                if(name){
                    const findName = await db.playlist.findOne({
                        where:{
                            userId: res.locals.user.id,
                            name: req.body.newName
                        }
                    })
                    if(!findName){
                        await findPlaylist.update({name: req.body.newName, status: public})
                        res.redirect('/users/profile')
                    }else{
                        res.send('nooo')
                    }
                }else{
                    await findPlaylist.update({status: public})
                    res.redirect('/users/profile')
                }
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
    
    const path = require('path')
    router.use(express.static(path.join(__dirname, 'public')))
    module.exports = router