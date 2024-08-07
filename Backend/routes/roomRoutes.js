const express = require('express');
const { createRoom, getRooms,getAllRooms,getALLRoomsRent, getRoomById, updateRoom, deleteRoom,startRoomRent, endRoomRent } = require('../controllers/roomsController');

const router = express.Router();

router.post('/', createRoom);
router.get('/', getRooms);
router.get('/all', getAllRooms);
router.get('/all/rent', getALLRoomsRent);
router.put('/:id', updateRoom);
router.delete('/:id', deleteRoom);
router.get('/:id', getRoomById);
router.post('/rent/start/:id', startRoomRent);
router.post('/rent/end/:id', endRoomRent);

module.exports = router;
