const router = require('express').Router();
const { createItem, getItems, getAllItems, updateItem, deleteItem, checkItemStatus } = require('../controllers/inventoryController');

router.use('/auth', require('./auth.routes'));
router.use('/rent', require('./rent.routes'));



module.exports = router;
