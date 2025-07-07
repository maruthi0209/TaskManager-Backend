const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const authController = require('../controllers/authenticationCont');

const admin = require('firebase-admin'); // Import Firebase Admin SDK
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Your User model

// POST /api/auth/google-firebase
// Handles Google Sign-In verification via Firebase ID Token
router.post('/google-firebase', async (req, res) => {
  const { firebaseIdToken } = req.body;

  if (!firebaseIdToken) {
    return res.status(400).json({ message: 'Firebase ID token is required.' });
  }

  try {
    // 1. Verify the Firebase ID token using Firebase Admin SDK
    const decodedToken = await admin.auth().verifyIdToken(firebaseIdToken);
    // `decodedToken` contains the Firebase user's info, including `uid`
    const { uid, email, name, picture } = decodedToken;

    // 2. Check if user already exists in your local MongoDB database
    let user = await User.findOne({ firebaseUid: uid });

    if (!user) {
      // 3. If user doesn't exist, create a new user in MongoDB
      // You can also link existing users by email if you have traditional sign-ups
      user = new User({
        firebaseUid: uid,
        email,
        name: name || 'User', // Provide a default name if not available
        picture: picture || '',
      });
      await user.save();
    }
    // Optional: If user exists but their details (name, picture) change in Firebase, update them here
    // user.name = name;
    // user.picture = picture;
    // await user.save();

    // 4. Generate your own application-specific JWT for session management
    const appToken = jwt.sign(
      { id: user._id, email: user.email, firebaseUid: user.firebaseUid },
      process.env.JWT_SECRET,
      { expiresIn: '1h' } // Token expires in 1 hour
    );

    // 5. Send back your app's JWT and basic user info to the frontend
    res.status(200).json({
      message: 'Google login successful via Firebase!',
      token: appToken,
      user: {
        id: user._id,
        email: user.email,
        name: user.name,
        picture: user.picture,
        firebaseUid: user.firebaseUid,
      },
    });

  } catch (error) {
    console.error('Error verifying Firebase ID token or processing user:', error);
    res.status(401).json({ message: 'Firebase Google login failed: Invalid token or server error.' });
  }
});

// Protect all routes after this middleware
router.use(authController.protect);
router.use(authController.restrictTo('admin'));

router
  .route('/')
  .get(userController.getAllUsers);

router
  .route('/:id')
  .get(userController.getUser)
  .patch(userController.updateUser)
  .delete(userController.deleteUser);

router.patch('/:id/deactivate', userController.deactivateUser);
router.patch('/:id/activate', userController.activateUser);



module.exports = router;