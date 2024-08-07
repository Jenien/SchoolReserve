const router = require('express').Router();
const { login,registerUser, registeradmin,authenticateUser,registerSU , changePassword,forgotPassword, getAllUser } = require('../controllers/auth.controller');
// const { image } = require ('../libs/multer');

router.post('/login', login);
// router.post('/logout', authenticateUser, logout);
router.post('/register/user', registerUser);
router.post('/register/su', registerSU);
router.post('/register/admin', authenticateUser, registeradmin);
router.post('/forgotPassword', forgotPassword);
router.post('/change-password', changePassword);
// router.get('/getAlluser', authenticateUser,getAllUser);
// router.get('/profile', authenticateUser,getUserProfile);
// router.put('/profile/update',image.single('profile_picture'),authenticateUser, updateProfile);
// router.delete('/profile-picture', authenticateUser, deleteProfilePicture);


module.exports = router;