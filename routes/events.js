const admin = require('firebase-admin'),

    express = require('express'),
    bodyParser = require('body-parser');
router = express.Router();
router.use(bodyParser.json());
db = admin.firestore();
const FieldValue = require('firebase-admin').firestore.FieldValue;

//Create New Event


router.route('/new')
    .get((req, res) => {
        res.render('newEvent');
    })
    .post(async (req, res) => {
        try {
            var dt = req.body.date + 'T' + req.body.time + ':00';
            var datetime = new Date(dt);
            var organisationId = req.user.uid;
            const data = {
                name: req.body.name,
                organisationId: organisationId,
                dateTime: datetime,
                description: req.body.description,
                location: req.body.location,
                isFinished: false
            }
            // console.log(req.body.date + " " + req.body.time);
            const addData = await db.collection('events')
                .add(data);
            addData.get()
                .then(async (snapshot) => {
                    var id = snapshot.id;
                    // console.log(snapshot.id + '\n' + snapshot.data().location);
                    const updateOrg = await db.collection('organisations')
                        .doc(organisationId)
                        .update({ "events": FieldValue.arrayUnion(id) })
                        .then(snapshot => {
                            console.log('updated successfully');
                        });
                })
            res.redirect('/event/manage');
        }
        catch (err) {
            res.send(err);
        }
    })


router.get('/past', async (req, res) => {
    try {
        var organisationId = req.user.uid;

        var organisationRef = db.collection('organisations')
            .doc(organisationId);
        console.log('Events');
        var getEvent = organisationRef.get()
            .then(async (snapshot) => {
                var events = snapshot.data().events;
                if (!events) {
                    var message = 'You have no events in record. Create a new event to get started.';
                    // console.log('No event');
                    res.render('pastEvent', { message: message });
                }
                else {
                    // console.log('Event');
                    pastEvents = [];
                    count = 0;
                    for (x of events) {
                        var checkEvent = await db.collection('events')
                            .doc(x);
                        var check = await checkEvent.get();
                        if (check.data().isFinished) {
                            var usersAttended = await checkEvent.collection('users').where('hasAttended', '==', true).get().then(snapshot => {
                                return snapshot.size;
                            })
                            var usersRegistered = await checkEvent.collection('users').where('hasRegistered', '==', true).get().then(snapshot => {
                                return snapshot.size;
                            })
                            var data = check.data();
                            data['eventId'] = x;
                            data['usersAttended'] = usersAttended;
                            data['usersRegistered'] = usersRegistered;
                            data['count'] = count++;
                            pastEvents.push(data);
                        } else {
                            continue;
                        }

                    }
                    // console.log(pastEvents);
                    if(pastEvents.length == 0){
                        var message = 'You have no events in record. Create a new event to get started.';
                        // console.log('No event');
                        res.render('pastEvent', { message: message });
                        }
                        else{
                            res.render('pastEvent', { pastEvents, message: false });
                        }
                }
            })


        // res.render('pastEvent');

    }
    catch (err) {
        res.send(err);
    }
});

router.get('/manage', async (req, res) => {
    try {
        var organisationId = req.user.uid;

        var organisationRef = db.collection('organisations')
            .doc(organisationId);
        // console.log('Events');
        var getEvent = organisationRef.get()
            .then(async (snapshot) => {
                var events = snapshot.data().events;
                // console.log(events.length);
                if (!events ) {
                    var message = 'You currently do not have any event in coming future.';
                    // console.log('No event');
                    res.render('manageEvent', { message: message });
                }
                else {
                    // console.log('Event');
                    Events = [];
                    var countm = 0;
                    for (x of events) {
                        var checkEvent = await db.collection('events')
                            .doc(x);
                        var check = await checkEvent.get();
                        if (!check.data().isFinished) {
                            var usersFollowed = await checkEvent.collection('users').where('hasRegistered', '==', false).get().then(snapshot => {
                                return snapshot.size;
                            })
                            var usersRegistered = await checkEvent.collection('users').where('hasRegistered', '==', true).get().then(snapshot => {
                                return snapshot.size;
                            })
                            var data = check.data();
                            data['eventId'] = x;
                            data['usersFollowed'] = usersFollowed;
                            data['usersRegistered'] = usersRegistered;
                            data['count'] = countm++;
                            Events.push(data);
                        } else {
                            continue;
                        }

                    }
                    // console.log(Events);
                    if(!(Events.length == 0)){
                    res.render('manageEvent', { Events, message: false });
                    }
                    else{
                        var message = 'You currently do not have any event in coming future.';
                    // console.log('No event');
                    res.render('manageEvent', { message: message });
                    }
                }
            })


        // res.render('pastEvent');

    }
    catch (err) {
        res.send(err);
    }
});


router.post('/message', async (req, res) => {
    try {
        console.log(req.body);
        var organisationId = req.user.uid;
        await db.collection('events')
            .doc(req.body.eventId)
            .collection('messages')
            .add({
                eventId: req.body.eventId,
                text: req.body.message,
                senderName: 'admin',
                senderUid: organisationId

            })
            .then(() => {
                res.redirect('back');
            })


    }
    catch (err) {
        console.log(err.message);
        res.send(err);
    }
})

router.post('/organiser/delete', async(req,res)=>{
    var organisationId = req.user.uid;

    await db.collection('organisations')
    .doc(organisationId)
    .update({ "organisers": FieldValue.arrayRemove(req.body.organiserId)})
    .then(()=>{
        res.redirect('back')
    })
})

router.post('/organiser/add', async(req,res) =>{
    var organiser = await db.collection('users')
                            .where('phoneNumber', '==', req.body.phoneNumber)
                            .get()
                            .then(async(snap) => {
                                if(snap.empty){
                                    res.render('error', {message: 'Cannot find user in our record. Please see if user is signed up in the app or the number is correct.'});
                                }
                                else{
                                    var organisationId = req.user.uid;
                                    snap.forEach(async(doc) => {
                                        await db.collection('organisations')
                                        .doc(organisationId)
                                        .update({ "organisers": FieldValue.arrayUnion(doc.data().uid) })
                                        .then(()=>{
                                            res.redirect('back')
                                        })
                                    });
                                }
                                
                            })
                           


   

})

module.exports = router;
