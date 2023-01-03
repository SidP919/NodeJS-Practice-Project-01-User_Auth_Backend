require('dotenv').config()
const express = require("express");
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const cookieParser = require('cookie-parser');
require('./config/mongodb_connect').connect()

//import model - user
const User = require("./model/user");

const app = express();

// built-in middlewares
app.use(express.json());
app.use(express.urlencoded({extended:true}));

// third-party middlewares
app.use(cookieParser());

// custom middleware
const auth = require('./middleware/auth');

const AUTH_SECRET = process.env.AUTH_SECRET;

app.get('/', (req,res)=>{
    res.send("User-Auth-Backend's Home Route")
});

//Register
app.post("/register", async (req,res) => {
    try {
        // Collect the required info sent in req.body
        const {firstname, lastname, email, password} = req.body;

        // Proceed further only if all required info has been sent in req.body
        if(!(firstname && lastname && email && password)){
            res.status(400).send("Not all mandatory fields were provided!")
        }

        // Proceed only if user email is unique & doesn't already exist
        const ifExistingUser = await User.findOne({email});
        if(ifExistingUser){
            res.status(400).send("A User with same email-id already exists!")
        }

        // Encrypt the Password
        const saltRounds = 10; // For NodeJS, by-default, saltRounds = 10 rounds.
        const encryptedPwd = await bcrypt.hash(password, saltRounds); 

        // Save encrypted password & user info in DB & send token/key to frontend
        const user = await User.create({
            firstname,
            lastname,
            email,
            password: encryptedPwd,
        });
        const token = jwt.sign(
            { 
                id: user._id, 
                email 
            },
            AUTH_SECRET,
            {
                expiresIn:'2h'
            });
        user.auth_token = token;
        // we have saved the encrypted pwd in DB 
        // but we won't send its value in response or log it anywhere. 
        // Hence, we make it undefined:
        user.password = undefined;
        res.status(201).json(user);

    } catch (error) {
        console.log(error);
        console.log("Above Error occured while registering the user!");
    }
})

// Login
app.post('/login', async (req,res) => {
    try {
        // Collect the required info sent in req.body
        const {email, password} = req.body;
        
        // Proceed further only if all required info has been sent in req.body
        if(!(email && password)){
            res.status(400).send("Not all mandatory fields were filled correctly!")
        }

        // Encrypt password sent in req & compare it with saved password in DB
        const user = await User.findOne({email});
        if(user && (await bcrypt.compare(password, user.password))){
            // Currently, user object holds the encrypted pwd from DB 
            // and we don't want to send its value in response 
            // or log it anywhere due to security concerns.
            // Hence, we make it undefined:
            user.password = undefined;
            
            // If password validation success, send token/key to frontend(direct/cookie)
            const token = jwt.sign(     // generates auth-token
                {
                    id: user._id,
                    email
                },
                AUTH_SECRET,
                {
                    expiresIn: '2h'
                }
            );
            user.auth_token = token;
            const options = {
                expires: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
                httpOnly: true
            }
            res.status(200)
                .cookie('auth_token', token, options)
                .json({
                    success: true, // Optional
                    user, // Optional
                    token // Optional
                });
        }else{
            // If password validation failed, send error response
            res.status(401).send("Your Email or/and Password are either incorrect or doesn't exist!");
        }
    } catch (error) {
        console.log(error);
        console.log("Above error occured while login authentication!")
    }
})

// Dashboard
app.get('/dashboard', auth, (req, res) => {
    res.send("Welcome to Dashboard!");
})

// Profile
app.get('/profile', auth, async (req, res) => {
    if(req.user){
        try {
            // Get id from req.user object from middleware/auth.js
            const id = req.user.id;

            // Query DB using findOne({id}) and get user's profile data
            const user = await User.findOne({id});
            user.password = undefined;
            
            // send a json response with profile data to frontend
            res.send(`
                <h1>My Profile</h1>
                <h3>Name: ${user.firstname} ${user.lastname}</h3>
                <h3>Email: ${user.email}</h3>
            `);
        } catch (error) {
            res.status(422).send("Unable to retrieve Profile info! Please try again later.");
        }
    }
    else
        res.status(403).send("Authentication Failed! Please login and try again.");
});

module.exports = app;