// create an instance of express routers
const express = require("express");
require("dotenv").config();
const db = require("../models");
const router = express.Router();
const crypto = require("crypto-js");
const bcrypt = require("bcrypt");
const axios = require("axios");
// const Sequelize = require("sequelize");
const API_KEY = process.env.API_KEY;
const OTHER_KEY = process.env.OTHER_KEY;
// mount our routes on the router

// GET /users/new -- serves a form to create a new user
router.get("/new", function (req, res) {
  res.render("users/new.ejs", {
    user: res.locals.user,
  });
});

// POST /users -- creates a new user from the form @ /users/new
router.post("/", async function (req, res) {
  try {
    // based on the info in the req.body, find or create user
    const [newUser, created] = await db.user.findOrCreate({
      where: {
        email: req.body.email,
      },
    });
    // if the user is found, redirect user to login
    if (!created) {
      //console.log('user exists!')
      res.redirect("/users/login?message=Please log in to continue.");
    } else {
      // here we know its a new user
      // hash the supplied password
      const hashedPassword = bcrypt.hashSync(req.body.password, 12);
      // save the user with the new password
      newUser.password = hashedPassword;
      newUser.name = req.body.name;
      await newUser.save(); // actually save the new password in th db
      // ecrypt the new user's id and convert it to a string
      const encryptedId = crypto.AES.encrypt(
        String(newUser.id),
        process.env.SECRET
      );
      const encryptedIdString = encryptedId.toString();
      // place the encrypted id in a cookie
      res.cookie("userId", encryptedIdString);
      // redirect to user's profile
      res.redirect("/users/profile");
    }
  } catch (err) {
    //console.log(err)
    res.status(500).send("server error");
  }
});

// GET /users/login -- render a login form that POSTs to /users/login
router.get("/login", function (req, res) {
  res.render("users/login.ejs", {
    message: req.query.message ? req.query.message : null,
    user: res.locals.user,
  });
});

// POST /users/login -- ingest data from form rendered @ GET /users/login
router.post("/login", async function (req, res) {
  try {
    // look up the user based on their email
    const user = await db.user.findOne({
      where: {
        email: req.body.email,
      },
    });
    // boilerplate message if login fails
    const badCredentialMessage = "username or password incorrect";
    if (!user) {
      // if the user isn't found in the db
      res.redirect("/users/login?message=" + badCredentialMessage);
    } else if (!bcrypt.compareSync(req.body.password, user.password)) {
      // if the user's supplied password is incorrect
      res.redirect("/users/login?message=" + badCredentialMessage);
    } else {
      // if the user is found and their password matches log them in
      //console.log('loggin user in!')
      const encryptedId = crypto.AES.encrypt(
        String(user.id),
        process.env.SECRET
      );
      const encryptedIdString = encryptedId.toString();
      // place the encrypted id in a cookie
      res.cookie("userId", encryptedIdString);
      res.redirect("/users/profile");
    }
  } catch (err) {
    //console.log(err)
    res.status(500).send("server error");
  }
});

// GET /users/logout -- clear any cookies and redirect to the homepage
router.get("/logout", function (req, res) {
  // log the user out by removing the cookie
  // make a get req to /
  res.clearCookie("userId");
  res.redirect("/");
});

// GET /users/profile -- show the user their profile page
//==SHOWS LIST OF PLAYLISTS USER HAS==\\
router.get("/profile", async function (req, res) {
  // if the user is not logged in -- they are not allowed to be here
  try {
    if (!res.locals.user) {
      res.redirect(
        "/users/login?message=You must authenticate before you are authorized to view this resource!"
      );
    } else {
      const findPlaylists = await db.playlist.findAll({
        where: {
          userId: parseInt(res.locals.user.id),
        },
      });
      res.render("users/profile.ejs", {
        user: res.locals.user,
        playlists: findPlaylists,
      });
    }
  } catch (error) {
    res.send("you messed up in get /users/profile" + error);
  }
});

// RENDERS PAGE TO SEE LIST OF LIKES AND COMMENT A USER HAS MADE BEFORE
router.get("/actions", async function (req, res) {
  try {
    if (res.locals.user) {
      const findAll = await db.activity.findAll({
        where: {
          userId: res.locals.user.id,
        },
      });
      let findLikes = findAll.filter((activity) => activity.like == true);
      let findComments = findAll.filter((activity) => activity.comment != null);
      let findPlaylist;
      if (findLikes.length > 0) {
        for (let i in findLikes) {
          findPlaylist = await db.playlist.findByPk(findLikes[i].playlistId);
          findLikes[i].name = `${findPlaylist.name}`;
          if (findPlaylist.status != true) {
            findLikes.splice(i, i);
          }
        }
      }
      if (findComments.length > 0) {
        for (let i in findComments) {
          findPlaylist = await db.playlist.findByPk(findComments[i].playlistId);
          findComments[i].name = `${findPlaylist.name}`;
          if (findPlaylist.status != true) {
            findComments.splice(i, i);
          }
        }
      }
      res.render("users/actions.ejs", {
        likes: findLikes,
        comments: findComments,
      });
    }
  } catch (error) {
    res.send("you messed up in get /users/likes" + error);
  }
});

// export the router
const path = require("path");
router.use(express.static(path.join(__dirname, "public")));
module.exports = router;
