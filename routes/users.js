const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const passport = require('passport');
var admin = require("firebase-admin");

db = admin.firestore();


//Register handle
router.post('/login',(req,res,next)=>{
passport.authenticate('local',{
    successRedirect : '/dashboard',
    failureRedirect: '/users/login',
    failureFlash : true
})(req,res,next)
})
  //register post handle
  router.post('/register',async(req,res)=>{
    const {name,email, password, password2} = req.body;
    let errors = [];
    console.log(' Name ' + name+ ' email :' + email+ ' pass:' + password);
    if(!name || !email || !password || !password2) {
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
        name : name,
        email : email,
        password : password,
        password2 : password2})
     } else {
        //validation passed
    const findEmail = db.collection('organisations').where('email', '==', email);
    
    const snap = await findEmail.get();

    if(snap.exists){
        errors.push({msg: 'email already registered'});
        res.render('register',{errors,name,email,password,password2})  
    } else {
        const passwordHash = await bcrypt.hash(req.body.password, 10);
        const data = {
            // organisationName: req.body.organisation,
            // contactNumber: req.body.contact,
            // website: req.body.website,
            // registrationDocumentLink: req.body.registered,
            // password: password,
            // isVerified: false,
            // email: email,
            // events: [],
            // organisers: []
            name : name,
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

            res.redirect('/users/login');
            console.log('Created:', doc.id); // eslint-disable-next-line handle-callback-err
            
        });
       
    }
    }
    })
//logout
router.get('/logout',(req,res)=>{
req.logout();
req.flash('success_msg','Now logged out');
res.redirect('/'); 
})
module.exports  = router;