const express = require("express");
require("dotenv").config();
const db = require("../models");
const router = express.Router();
const axios = require("axios");
const API_KEY = process.env.API_KEY;
const OTHER_KEY = process.env.OTHER_KEY;
//== RENDERS THE GET ALL SONGS FROM ALL PLAYLISTS CORRESPONDING TO USER
//
router.get("/songs", async function (req, res) {
  try {
    if (res.locals.user) {
      //  finds all playlists a user has and gets all the songs within them
      const findUser = await db.user.findByPk(res.locals.user.id);
      const findPlaylists = await findUser.getPlaylists();
      let allSongs = [];
      let songs;

      for (let i = 0; i < findPlaylists.length; i++) {
        songs = await findPlaylists[i].getSongs();
        for (let j = 0; j < songs.length; j++) {
          allSongs.push(songs[j]);
        }
      }
      // checking that the new array i created for the songs does not hold duplicates in the case of a user having the same song in multiple playlists
      const newArr = allSongs.map((song) => [song.id, song]);
      const newMap = new Map(newArr);
      const iterator = newMap.values();
      const unique = [...iterator];
      res.render("lists.ejs", {
        song: unique,
        userSongs: true,
        searchBy: "userSongs",
      });
    } else {
      res.send("loggin first");
    }
  } catch (error) {
    res.send("You messed up in the get /playlists/songs" + error);
  }
});

//==ADDS SONG TO SPECIFIC PLAYLIST==\\
router.post("/songs/:id", async function (req, res) {
  try {
    if (res.locals.user != null) {
      const response = await axios.get(
        `https://api.musixmatch.com/ws/1.1/track.get?commontrack_id=${req.params.id}&f_has_lyrics=1&apikey=${API_KEY}`
      );
      const findPlaylist = await db.playlist.findOne({
        where: {
          userId: res.locals.user.id,
          name: req.body.playlist,
        },
      });
      const [findSong, created] = await db.song.findOrCreate({
        where: {
          track: parseInt(req.params.id),
          name: response.data.message.body.track.track_name,
          artist: response.data.message.body.track.artist_name,
        },
      });
      await findPlaylist.addSong(findSong);
      res.redirect("/users/profile");
    } else {
      res.send("login to an account first");
    }
  } catch (error) {
    // console.log(req.params.id)
    res.send("you messed up in the users/songs/:id post route" + error);
  }
});

//==READS SPECIFIC USERS PLAYLIST==\\
router.get("/:id", async function (req, res) {
  try {
    const findPlaylist = await db.playlist.findOne({
      where: {
        id: parseInt(req.params.id),
      },
      include: {
        model: db.user,
      },
    });
    const findAll = await db.activity.findAll({
      where: {
        playlistId: findPlaylist.id,
      },
      include: {
        model: db.user,
      },
    });
    // filtering out the comments from the likes
    let findLikes, likeCount, findComments;
    findLikes = findAll.filter((activity) => activity.like == true);
    likeCount = findLikes.length;
    findComments = findAll.filter((activity) => activity.comment != null);
    let view, owner, userLike, userComments;
    if (findPlaylist == null) {
      res.send("does not exist");
    } else {
      // checking if a playlist is public or if the user logged in might be the owner
      const songs = await findPlaylist.getSongs();
      findPlaylist.status ? (view = true) : (view = false);
      if (res.locals.user) {
        userLike = await db.activity.findOne({
          where: {
            playlistId: findPlaylist.id,
            userId: res.locals.user.id,
            like: true,
          },
        });
        userComments = findComments.filter(
          (comment) => comment.userId == res.locals.user.id
        );
        userLike != null ? (userLike = true) : (userLike = false);

        findPlaylist.userId == res.locals.user.id
          ? (owner = true)
          : (owner = false);
      } else {
        owner = false;
      }
      res.render("playlistsongs.ejs", {
        playlist: findPlaylist,
        songs: songs,
        owner: owner,
        view: view,
        likes: likeCount,
        comments: findComments,
        userLike: userLike,
        userComments: userComments,
      });
    }
  } catch (error) {
    //========MESSAGE WILL SAY PLAYLIST DOES NOT EXIST ==///
    console.log(
      "🐙🐙🐙🐙🐙You messed up in the get /playlists/:id🐙🐙🐙🐙" + error
    );
    res.send("You messed up in the get /playlists/:id" + error);
  }
});

//====CREATES A USERS PLAYLIST====\\
router.post("/", async function (req, res) {
  try {
    // checking to see if User already has a playlist with that same name
    let public;
    req.body.status == "public" ? (public = true) : (public = false);
    const findPlaylist = await db.playlist.findOne({
      where: {
        userId: res.locals.user.id,
        name: req.body.newPlaylist,
      },
    });
    if (findPlaylist) {
      res.send("you already have a playlist with that name");
    } else {
      const createPlaylist = await db.playlist.create({
        userId: res.locals.user.id,
        name: req.body.newPlaylist,
        status: public,
        likes: 0,
      });
      res.redirect("/users/profile");
    }
  } catch (error) {
    res.send("you messed up in the post /playlist " + error);
  }
});

//== ALLOWS USER TO POST COMMENTS TO SPECIFIC PLAYLIST
router.post("/comments", async function (req, res) {
  try {
    // making sure user is logged in to allow this interaction
    if (res.locals.user) {
      const findPlaylist = await db.playlist.findOne({
        where: {
          id: req.body.playlistId,
        },
      });
      const createComment = await db.activity.create({
        userId: res.locals.user.id,
        playlistId: findPlaylist.id,
        comment: req.body.comment,
      });
      res.redirect(`/playlists/${findPlaylist.id}`);
    } else {
      res.send("no can do");
    }
  } catch (error) {
    res.send("you messed up in the post /playlist/comments " + error);
  }
});

//=== ALLOWS USER TO UPDATE A COMMENT FROM PLAYLIST
router.put("/comments", async function (req, res) {
  try {
    const findComment = await db.activity.findByPk(req.body.commentId);
    await findComment.update({ comment: `${req.body.updatedComment}` });
    res.redirect(`/playlists/${req.body.playlistId}`);
  } catch (error) {
    res.send("you messed up in the put /playlists/comments " + error);
  }
});

//== ALLOWS USER TO DELETE A COMMENT FROM PLAYLIST
router.delete("/comments", async function (req, res) {
  try {
    const findComment = await db.activity.destroy({
      where: {
        id: req.body.commentId,
      },
    });
    res.redirect(`/playlists/${req.body.playlistId}`);
  } catch (error) {
    res.send("You messed up in the delete /playlist/comments" + error);
  }
});

//===== ALLOWS USER TO LIKE A PLAYLIST
router.post("/likes", async function (req, res) {
  try {
    if (res.locals.user) {
      const findPlaylist = await db.playlist.findOne({
        where: {
          id: req.body.playlistId,
        },
      });
      // making sure that a user hasn't already liked this
      const [addLike, created] = await db.activity.findOrCreate({
        where: {
          userId: res.locals.user.id,
          playlistId: findPlaylist.id,
          like: true,
        },
      });
      const findAll = await db.activity.findAll({
        where: {
          playlistId: findPlaylist.id,
        },
      });
      const findLikes = findAll.filter((activity) => activity.like == true);
      const findComments = findAll.filter(
        (activity) => activity.comment != null
      );
      const amount = await db.activity.count({
        where: {
          playlistId: findPlaylist.id,
          like: true,
        },
      });
      res.redirect(`/playlists/${findPlaylist.id}`);
    } else {
      res.send("no can do");
    }
  } catch (error) {
    res.send("you messed up in the post /playlist/likes " + error);
  }
});

// == FINDS A LIKE A USER HAS MADE ON A PLAYLIST AND DELETES FROM DB
router.delete("/likes", async function (req, res) {
  try {
    const findLike = await db.activity.destroy({
      where: {
        playlistId: req.body.playlistId,
        userId: res.locals.user.id,
        like: true,
      },
    });
    res.redirect(`/playlists/${req.body.playlistId}`);
  } catch (error) {
    res.send("you messed up in the delete /playlist/likes " + error);
  }
});

//====RENAMES A USERS PLAYLIST AND ALLOWS PUBLIC STATUS TO CHANGE====\\
router.put("/", async function (req, res) {
  try {
    if (req.body.like) {
      res.send("clicked");
    } else {
      let name = req.body.newName;
      let public;
      req.body.status == "public" ? (public = true) : (public = false);
      const findPlaylist = await db.playlist.findOne({
        where: {
          userId: res.locals.user.id,
          name: req.body.playlist,
        },
      }); //checking to see if user wants to update name as well or just status
      if (name) {
        // making sure user doesn't already have another playlist with the new name they selected
        const findName = await db.playlist.findOne({
          where: {
            userId: res.locals.user.id,
            name: req.body.newName,
          },
        });
        if (!findName) {
          await findPlaylist.update({ name: req.body.newName, status: public });
          res.redirect("/users/profile");
        } else {
          res.send("nooo");
        }
      } else {
        await findPlaylist.update({ status: public });
        res.redirect("/users/profile");
      }
    }
  } catch (error) {
    res.send("you messed up in the put /playlist " + error);
  }
});

//====DELETES A USERS PLAYLIST====\\
router.delete("/", async function (req, res) {
  try {
    const findPlaylist = await db.playlist.destroy({
      where: {
        userId: res.locals.user.id,
        name: req.body.deletePlaylist,
      },
    });
    res.redirect("/users/profile");
  } catch (error) {
    res.send("you messed up in the delete /playlists " + error);
  }
});

//==REMOVES SONG FROM USERS PLAYLIST==\\
router.delete("/:playlistName/songs/:songId", async function (req, res) {
  try {
    const findPlaylist = await db.playlist.findOne({
      where: {
        userId: res.locals.user.id,
        name: req.params.playlistName,
      },
    });
    const findSong = await db.song.findOne({
      where: {
        track: req.params.songId,
      },
    });
    await findPlaylist.removeSong(findSong);
    res.redirect("/users/profile");
  } catch (error) {
    res.send("you messed up in the delete /playlist " + error);
  }
});

const path = require("path");
router.use(express.static(path.join(__dirname, "public")));
module.exports = router;
