var express = require("express");
var router = express.Router();
var mongoose = require("mongoose");
var passport = require("passport");

//Load input validation
const validateProfileInput = require("../../validation/profile");
//Load profile and user Model
var Profile = require("../../models/Profile");
var User = require("../../models/User");

//@route  GET api/profile/test
//@desc   Test profile route
//@access Public
router.get("/test", (req, res) => res.json({ msg: "Posts works" }));

//@route  GET api/profile
//@desc   Get current users profile
//@access Private
router.get(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const errors = {};
    Profile.findOne({ user: req.user.id })
      .populate("user", ["fullname", "avatar"])
      .then(profile => {
        if (!profile) {
          errors.noprofile = "There is no profile for this user!";
          return res.status(404).json(errors);
        }
        res.json(profile);
      })
      .catch(err => res.status(404).json(err));
  }
);
//@route  POST api/profiles
//@desc   Create user profile
//@access Private
router.post(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    const { errors, isValid } = validateProfileInput(req.body);

    // Check Validation
    if (!isValid) {
      // Return any errors with 400 status
      return res.status(400).json(errors);
    }
    // Get fields
    const profileFields = {};
    profileFields.user = req.user.id;
    if (req.body.dateOfBirth) profileFields.dateOfBirth = req.body.dateOfBirth;
    if (req.body.gender) profileFields.gender = req.body.gender;
    if (req.body.phone) profileFields.phone = req.body.phone;
    // Adress
    profileFields.social = {};
    if (req.body.city) profileFields.adress.city = req.body.city;
    if (req.body.district) profileFields.adress.district = req.body.district;
    if (req.body.commnune) profileFields.adress.commnune = req.body.commnune;

    Profile.findOne({ user: req.user.id }).then(profile => {
      if (profile) {
        //Update
        Profile.findOneAndUpdate(
          { user: req.user.id },
          { $set: profileFields },
          { new: true }
        )
          .then(profile => res.json(profile))
          .catch(err => res.json("USER: " + req.user.id + "::" + err));
      } else {
        // Create

        // Check if phone exists
        Profile.findOne({ phone: profileFields.phone }).then(profile => {
          if (profile) {
            errors.phone = "That phone number already exists";
            res.status(400).json(errors);
          }

          // Save Profile
          new Profile(profileFields).save().then(profile => res.json(profile));
        });
      }
    });
  }
);

//@route  POST api/profile/user/:user_id
//@desc   Get profile by user id
//@access Public
router.get("/user/:user_id", (req, res, next) => {
  Profile.findOne({ user: req.params.user_id })
    .populate("user", ["fullname", "avatar"])
    .then(profile => {
      if (!profile) {
        errors.noprofile = "There is no profile for this user";
        res.status(404).json(errors);
      }
      res.json(profile);
    })
    .catch(err =>
      res.status(404).json({ profile: "There is no profile for this user" })
    );
});

//@route  POST api/profile/all
//@desc   Get all profiles
//@access Public
router.get("/all", (req, res, next) => {
  const errors = {};
  Profile.find()
    .populate("user", ["fullname", "avatar"])
    .then(profiles => {
      if (!profiles) {
        errors.noprofile = "There is no profiles";
        res.status(404).json(errors);
      }
      res.json(profiles);
    })
    .catch(err =>
      res.status(404).json({ profile: "There is no profile for this user" })
    );
});
// @route   DELETE api/profile
// @desc    Delete user and profile
// @access  Private
router.delete(
  "/",
  passport.authenticate("jwt", { session: false }),
  (req, res) => {
    Profile.findOneAndRemove({ user: req.user.id }).then(() => {
      User.findOneAndRemove({ _id: req.user.id }).then(() => {
        res.json({ success: true });
      });
    });
  }
);
module.exports = router;
