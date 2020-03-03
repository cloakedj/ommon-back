const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const passport = require('passport');

// Bring in User Model
let User = require('../models/user');

// Register Form
router.get('/register', function(req, res){
  res.render('register');
});

// Register Proccess
router.post('/register', function(req, res){
  const name = req.body.name;
  const email = req.body.email;
  const username = req.body.username;
  const password = req.body.password;
  const password2 = req.body.password2;
  let institution = req.body.institution;
  let course = req.body.course;
  let interests = req.body.interests;

  req.checkBody('name', 'Name is required').notEmpty();
  req.checkBody('email', 'Email is required').notEmpty();
  req.checkBody('email', 'Email is not valid').isEmail();
  req.checkBody('username', 'Username is required').notEmpty();
  req.checkBody('password', 'Password is required').notEmpty();
  req.checkBody('password2', 'Passwords do not match').equals(req.body.password);

  let errors = req.validationErrors();

  if(errors){
    res.render('register', {
      errors:errors
    });
  } else {
    let newUser = new User({
      name:name,
      email:email,
      username:username,
      password:password,
      institution:institution,
      course:course,
      interests:interests
    });

    bcrypt.genSalt(10, function(err, salt){
      bcrypt.hash(newUser.password, salt, function(err, hash){
        if(err){
          console.log(err);
        }
        newUser.password = hash;
        newUser.save(function(err){
          if(err){
            console.log(err);
            return;
          } else {
            req.flash('success','You are now registered and can log in');
            res.redirect('/users/login');
          }
        });
      });
    });
  }
});

// // Login Form
// router.get('/login', function(req, res){
//   res.render('login');
// });

// Login Process
router.post('/login', function(req, res, next){
  passport.authenticate('local',(err,user,info)=>{
    if (err) { return next(err); }
    if (!user) { return res.status(401).send("Unable To Login With Provided Credentials") }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      res.status(200).send(user);
    });
  })(req, res, next);
});

router.get('/timeline',async function(req,res){
  let timeline = [];
  try
  {
  const user = await User.findById(req.user._id);
  user.timeline.forEach(element => {
    timeline.push(element._doc);
  });
  res.render("timeline",{timeline : timeline});
  }
  catch(err){
    console.log(err);
  }
});
// logout
router.get('/logout', function(req, res){
  req.logout();
  req.flash('success', 'You are logged out');
  res.redirect('/users/login');
});

module.exports = router;
