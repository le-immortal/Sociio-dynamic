const express = require('express');
const mongoose = require('mongoose');
const router = express.Router();
const app = express();
const ejs = require('ejs');
const flash = require('connect-flash');
const session = require('express-session');
const passport = require("passport");
const logger = require('morgan');
const bodyParser = require('body-parser')
//passport config:
// firebase 
var firebase = require('firebase');
const firebaseConfig = require('./config');
firebase.initializeApp(firebaseConfig);
var admin = require("firebase-admin");
var serviceAccount = require("./serviceKey.json");
admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
    databaseURL: "https://sociio-fcc40.firebaseio.com"
});
db = admin.firestore();
require('./config/passport')(passport)

app.use(logger('dev'));

//EJS
app.set('views', './views');
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({ extended: true, useUnifiedTopology: true }));
app.use(express.static("public"));
app.use('/event', express.static('public'));
app.use('/event/message', express.static('public'));
//express session
app.use(session({
    secret : 'secret',
    resave : true,
    saveUninitialized : true
}));


app.use(passport.initialize());
app.use(passport.session());
app.use(flash());
app.use((req,res,next)=> {
    res.locals.success_msg = req.flash('success_msg');
    res.locals.error_msg = req.flash('error_msg');
    res.locals.error  = req.flash('error');
    next();
    })
    
//Routes
app.use('/',require('./routes/index'));
app.use('/users',require('./routes/users'));

port = 3000;

app.listen(port, () => {
    console.log('Connected to the port: ' + port);
})