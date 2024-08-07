const express = require('express');
const {   
   createItem,
   getItems,
   getItemsRented,
   updateItem,
   deleteItem,
   getItemById,
   startItemRent,
   getAllItems,
   endItemRent 
} = require('../controllers/inventoryController');

const router = express.Router();

router.post('/', createItem);
router.get('/', getItems);
router.get('/all', getAllItems);
router.get('/all/rent', getItemsRented);
router.put('/:id', updateItem);
router.delete('/:id', deleteItem);
router.get('/:id', getItemById);
router.post('/rent/start/:id', startItemRent);
router.post('/rent/end/:id', endItemRent);

module.exports = router;
