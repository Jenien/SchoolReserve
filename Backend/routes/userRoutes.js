const express = require('express');
const { registerSU,registerUser,registerTeacher, login,getAllUsers, getUserById, getUsers, updateUser, deleteUser } = require('../controllers/userController');
const { authenticateToken } = require('../middlewares/auth');
const router = express.Router();

router.post('/register', registerUser);
router.post('/register/admin',registerSU);
router.post('/register/teacher', authenticateToken, registerTeacher);
router.post('/login', login);
router.get('/',authenticateToken, getUsers);
router.get('/all',authenticateToken, getAllUsers);
router.get('/:id',authenticateToken, getUserById);
router.put('/:id',authenticateToken, updateUser);
router.delete('/:id',authenticateToken, deleteUser);

module.exports = router;
