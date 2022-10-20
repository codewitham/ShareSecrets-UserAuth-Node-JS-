//jshint esversion:6
require('dotenv').config();
const express = require('express');
const ejs = require('ejs');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
// const md5 = require('md5');
// const bcrypt = require("bcrypt"); 
// // const encrypt = require('mongoose-encryption');
// const saltRounds = 10;

const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static('public'));

app.use(session({
    secret: 'Our little secret',
    resave: false,
    saveUninitialized: false,
    // cookie: { secure: true }
  }));

app.use(passport.initialize());
app.use(passport.session());

app.set('view engine', 'ejs');
mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});

app.use(bodyParser.urlencoded({
    extended: true
}));

const userShema = new mongoose.Schema({
    email: String,
    password: String,
    secret: String
});

// console.log(process.env.SECRET);
secret = process.env.SECRET;
// userShema.plugin(encrypt, {secret: secret, encryptedFields: ["password"]});

userShema.plugin(passportLocalMongoose);

const User = new mongoose.model('User', userShema);

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.get("/", (req, res)=>{
    res.render("home")
});

app.get("/login", (req, res)=>{
    res.render("login")
});

app.get("/register", (req, res)=>{
    res.render("register")
});

// app.post("/login", (req, res)=>{
//     const username = req.body.username;
//     const password = req.body.password;

//     User.findOne({email: username}, function(err, foundUser){
//         if(err){
//             console.log(err);
//         }
//         else{
//             if(foundUser){
//                 bcrypt.compare(password, foundUser.password, function(err, result) {
//                     if(result === true){
//                         res.render("secrets")
//                     }
//                 });
//                 // if(foundUser.password === password){
//                 //     res.render('secrets')
//                 // }
//             }
//         }
//     })
// })

// app.post("/register", (req, res)=>{
//     bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
//         // Store hash in your password DB.
//         const newUser = new User({
//             email: req.body.username,
//             password: hash
//         });
//         newUser.save(function(err){
//             if(err){
//                 console.log(err);
//             }else{
//                 res.render('secrets');
//             }
//         });
//     });
    
// });

app.get("/secrets", function(req, res){
    if(req.isAuthenticated()){
        User.find({"secret": {$ne: null}}, function(err, foundUser){
            if(err){
                console.log(err);
            }
            else{
                if(foundUser){
                    res.render("secrets", {userSecrets: foundUser}); 
                }
            }
        })
    }
    else{
        res.redirect("/login")
    }
});

app.get("/submit", function(req, res){
    if(req.isAuthenticated()){
        res.render("submit")
    }
    else{
        res.redirect("/login")
    }
});

app.post("/submit", function(req, res){
    const secret = req.body.secret;
    id = req.user.id;
    console.log(id);
    User.findById(id, function(err, foundUser){
        if(err){
            console.log(err);
        }
        else{
            if(foundUser){
                foundUser.secret = secret;
                foundUser.save(function(){
                    res.redirect("/secrets")
                })
            }
        }
    })
})

app.get("/logout", function(req, res){
    req.logout(function(err){
        if(err){
            console.log(err);
        }
    });
    res.redirect("/");
})

app.post("/login", function(req, res){
    const user = new User({
        username: req.body.username,
        password: req.body.password
    })
    req.login(user, function(err){
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets")
            })
        }
    })
});

app.post("/register", function(req, res){
    User.register({username: req.body.username}, req.body.password, function(err, user){
        if(err){
            console.log(err);
            res.redirect("/register")
        }
        else{
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets")
            })
        }
    })
});

app.listen(3000, ()=>{
    console.log("Server is running on port 3000.")
})
