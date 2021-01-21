const User = require('../models/user');
const LocalStrategy = require('passport-local').Strategy;
const bcrypt = require('bcrypt');
const admin = require('firebase-admin');
db = admin.firestore();

module.exports = function(passport){
    passport.use(
        new LocalStrategy({usernameField: 'email'},async(email,password,done)=>{
            //match user
            const snapshot =await db.collection('organisations')
                                .where( 'email', '==', email).get();
            if (snapshot.empty) {
                console.log('No matching documents.');
                            return done(null,false,{message:'Email is not registered'});
                        }  
            pass = []
            var user = 0
            const hash = snapshot.forEach(async(doc) => {
                user = doc.data()
                await pass.push(doc.data().password);
              });
            bcrypt.compare(password, pass[0],(err,isMatch)=>{
                             if(err) throw err;
                             if(isMatch){
                                 return done(null,user);
                             } else{
                                 return done(null,false,{message: 'Incorrect Password'});
                             }})
        
            
        })
    )
    passport.serializeUser(function(user,done) {
        done(null,user.uid);
    })
    passport.deserializeUser(async function(id,done){

        // User.findById(id,function(err,user){
        //     done(err,user);
        // })
        const res = await db.collection('organisations').doc(id).get();
        // console.log(res.data());
        done(null, res.data());
    })
}