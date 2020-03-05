const express = require('express');
const router = express.Router();
const upload = require('./upload');
// Event Model
let Event = require('../models/event');
// User Model
let User = require('../models/user');
let Timeline = require('./timeline');
//All Competitions
router.get('/all', ensureAuthenticated, function(req, res){
  Event.find({}, function(err, events){
    if(err){
      console.log(err);
    } else {
      res.status(200).send({
        events: events
      });
    }
  });
});

// Add Submit POST Route
router.post('/add', upload.single('cover'),function(req, res){
  req.checkBody('event','Name is required').notEmpty();
  //req.checkBody('organiser','organiser is required').notEmpty();
  req.checkBody('info','Information is required').notEmpty();

  // Get Errors
  let errors = req.validationErrors();

  if(errors){
    res.render('add_event', {
      title:'Add Event',
      errors:errors
    });
  } else {
    let event = new Event();
    event.event = req.body.event;
    event.organiser = req.user._id;
    event.info = req.body.info;
    event.date = req.body.date;
    event.venue = req.body.venue;
    event.status = req.body.status;
    event.time = req.body.time;
    event.tags = req.body.tags.split(',');
    event.cover = "http://localhost:3000/images/" + req.file.filename;

    event.save(function(err,doc){
      if(err){
        console.log(err);
        return;
      } else {
        Timeline.addTimelineEvent(
          doc._id,
          req.user._id,
          `You Have Successfully Added An Event with the name ${event.event}`,
          "Congratulations",
          5
        )
        req.flash('success','event Added');
        res.redirect('/');
      }
    });
  }
});

//Get Attender
router.get('/attend/:id', function(req, res){
  Event.findByIdAndUpdate(req.params.id, 
    { $addToSet: { attenders:req.user._id }} , {
    new: true },(err,doc)=>{
      if (err) throw err;
      Timeline.addTimelineEvent(
        doc._id,
        req.user._id,
        `You Have Successfully Participated in An Event with the name ${doc.event}`,
        "All The Best",
        1
      )
      console.log('Attender Added:', req.user._id);
      res.redirect('/events/'+req.params.id);
    });
});


/*router.get('/attend/:id', function(req, res){
  Event.findById(req.params.id, function(err, event){
    User.findById(event.organiser, function(err, user){
      res.render('event', {
        event:event,
        organiser: user.name
      });
    });
  });
});*/

// Load Edit Form
router.get('/edit/:id', ensureAuthenticated, function(req, res){
  Event.findById(req.params.id, function(err, event){
    if(event.organiser != req.user._id){
      req.flash('danger', 'Not Authorized');
      return res.redirect('/');
    }
    res.render('edit_event', {
      title:'Edit Event',
      event:event
    });
  });
});

// Update Submit POST Route
router.post('/edit/:id', function(req, res){
  let event = {};
  event.event = req.body.event;
  event.info = req.body.info;
  event.date = req.body.date;
  event.venue = req.body.venue;
  event.status = req.body.status;
  event.time = req.body.time;
  event.tags = req.body.tags.split(',');
  let user = User.findById(event.organiser);
  let query = {_id:req.params.id}

  Event.update(query, event, function(err){
    if(err){
      console.log(err);
      return;
    } else {
      req.flash('success', 'event Updated');
      res.redirect('/');
    }
  });
});

// Delete event
router.delete('/:id', function(req, res){
  if(!req.user._id){
    res.status(500).send();
  }

  let query = {_id:req.params.id}

  Event.findById(req.params.id, function(err, event){
    if(event.organiser != req.user._id){
      res.status(500).send();
    } else {
      Event.remove(query, function(err){
        if(err){
          console.log(err);
        }
        res.send('Success');
        console.log('GHEy');
      });
    }
  });
});

// Get Single event
router.get('/:id', function(req, res){
  Event.findById(req.params.id, function(err, event){
    User.findById(event.organiser, function(err, user){
      res.status(200).send({
        event:event,
        organiser: user
      });
    });
  });
});

// Access Control
function ensureAuthenticated(req, res, next){
  if(req.isAuthenticated()){
    return next();
  } else {
    req.flash('danger', 'Please login');
    res.redirect('/users/login');
  }
}

module.exports = router;
