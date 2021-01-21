const express = require('express');
const router  = express.Router();
const {ensureAuthenticated} = require('../config/auth') 
const bcrypt = require('bcrypt');
const passport = require('passport');
var admin = require("firebase-admin");

db = admin.firestore();

//login handle

//Register handle1
router.post('/login',(req,res,next)=>{
passport.authenticate('local',{
    successRedirect : '/dashboard',
    failureRedirect: '/',
    failureFlash : true
})(req,res,next)
})
  //register post handle
  router.post('/register',async(req,res)=>{
    const {organisation,email, password, password2} = req.body;
    let errors = [];
    console.log(' Name ' + organisation+ ' email :' + email+ ' pass:' + password);
    if(!organisation || !email || !password || !password2) {
        errors.push({msg : "Please fill in all fields"})
    }
    //check if match
    if(password !== password2) {
        errors.push({msg : "passwords dont match"});
    }
    
    //check if password is more than 6 characters
    if(password.length < 6 ) {
        errors.push({msg : 'password atleast 6 characters'})
    }
    if(errors.length > 0 ) {
    res.render('register', {
        errors : errors,
        name : organisation,
        email : email,
        password : password,
        password2 : password2})
     } else {
        //validation passed
    const findEmail = db.collection('organisations').where('email', '==', email);
    
    const snap = await findEmail.get();
        // console.log(snap.size);
    if(snap.size){
        errors.push({msg: 'email already registered'});
        res.render('organisation',{errors,organisation,email,password,password2})  
    } else {
        const passwordHash = await bcrypt.hash(req.body.password, 10);
        const data = {
            organisationName: req.body.organisation,
            contactNumber: req.body.contact,
            website: req.body.website,
            registrationDocumentLink: req.body.registered,
            password: password,
            isVerified: false,
            email: email,
            events: [],
            organisers: [],
            email : email,
            password : passwordHash
        }
        await db
        .collection('organisations')
        .add(data)
        .then(async(doc) => {
            await db.collection('organisations')
            .doc(doc.id)
            .update({'uid': doc.id})
            .then(() => {
                console.log('success');
            })
            req.flash('success_msg','You have now registered!');

            res.redirect('/dashboard');
            console.log('Created:', doc.id); // eslint-disable-next-line handle-callback-err
            
        });
       
    }
    }
    })
//logout
router.get('/logout',(req,res)=>{
req.logout();
res.redirect('/'); 
})
//login page
router.get('/', (req,res)=>{
    res.render('organisation');
})
//register page
router.get('/register', (req,res)=>{
    res.render('register');
})
router.get('/dashboard',ensureAuthenticated,(req,res)=>{
    if(req.user.isVerified){
        res.render('profile',{
            user: req.user
        });
    }
    else{
        res.render('verify');
    }
   
})


router.route('/profile')
    .get(ensureAuthenticated, async (req, res) => {
       
        let organisationId = req.user.uid;
        // var organisationId = await firebase.auth().currentUser.uid;
        var orgRef = await db.collection('organisations')
            .doc(organisationId);

        var data = await orgRef.get().then(snapshot => {
            return snapshot.data();
        })
        if (data.organisers && (data.organisers.length)) {
            var organiserRef = data.organisers;
            var organisers = await db.collection('users').where('uid', 'in', organiserRef)
                .get()
                .then(snap => {
                    var organ = [];
                    snap.forEach(doc => {
                        organ.push(doc.data());
                    });
                    return organ;
                })
        }
        else {
            organiserRef = false;

        }

        res.render('manageProfile', { data, organisers });
    })
    .post(ensureAuthenticated,async (req, res) => {
        var organisationId = await firebase.auth().currentUser.uid;
        console.log(req.body);
        var update = await db.collection('organisations')
            .doc(organisationId)
            .update(req.body)
            .then(snapshot => {
                res.redirect('back');
            })
    })

const eventRouter = require('./events');
router.use('/event', ensureAuthenticated, eventRouter);


module.exports = router; 