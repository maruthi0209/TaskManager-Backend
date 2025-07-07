const express = require('express');
const authController = require('../controllers/authenticationCont');
const passport = require('passport');

const router = express.Router();

router.post('/register', authController.register);
router.post('/login', authController.login);

// Google OAuth routes
router.get(
  '/google',
  passport.authenticate('google', {
    scope: ['profile', 'email'],
  })
);

router.get(
  '/google/callback',
  passport.authenticate('google', {
    failureRedirect: '/login',
    session: false,
  }),
  (req, res) => {
    // Generate JWT token
    const token = signToken(req.user._id);
    
    // Redirect to frontend with token
    res.redirect(`${process.env.FRONTEND_URL}/auth/success?token=${token}`);
  }
);


module.exports = router;