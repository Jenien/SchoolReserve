const prisma = require('../libs/prisma');

const createRoom = async (req, res, next) => {
  const { name, capacity } = req.body;
  const userMakingRequest = req.user;

  // Periksa apakah pengguna yang membuat permintaan adalah admin
  if (userMakingRequest.role !== 'admin' ) {
    return res.status(403).json({ error: 'Only admins can create rooms' });
  }

  try {
    // Periksa apakah ruangan dengan nama yang sama sudah ada
    const existingRoom = await prisma.room.findFirst({
      where: { name },
    });

    if (existingRoom) {
      return res.status(409).json({ error: 'Room with this name already exists' });
    }

    // Buat ruangan baru
    const room = await prisma.room.create({
      data: { name, capacity },
    });

    res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

// Get all rooms with filters deletedAt = null and isRented = false
const getRooms = async (req, res, next) => {
  try {
    const rooms = await prisma.room.findMany({
      where: {
         deletedAt: null,
         isRented: false
      },
    });
    res.status(200).json({
      success: true,
      message: "rooms fetched successfully",
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
};

// Get all rooms with filters deletedAt = null and isRented = true
const getALLRoomsRent = async (req, res, next) => {
  try {
    const rooms = await prisma.room.findMany({
      where: {
        deletedAt: null,
        isRented: true,
      },
      include: {
        RoomRents: {
          include: {
            user: true,
          },
        },
      },
    });
    res.status(200).json({
      success: true,
      message: "rooms fetched successfully",
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
};

//Get All Rooms
const getAllRooms = async (req, res, next) => {
  try {

    const rooms = await prisma.room.findMany({
      where: {
         deletedAt: null
      },
    });

    res.json(rooms);
  } catch (error) {
    next(error);
  }
};

// Get a single room by ID
const getRoomById = async (req, res, next) => {
  const { id } = req.params;
  try {
    const room = await prisma.room.findUnique({
      where: { id: parseInt(id) },
    });
    if (!room) {
      return res.status(404).json({
        success: false,
        message: "Room not found",
        data: null,
      });
    }
    res.status(200).json({
      success: true,
      message: "Room fetched successfully",
      data: room,
    });
  } catch (error) {
    next(error);
  }
}

const updateRoom = async (req, res, next) => {
   const { name, capacity } = req.body;
   const userMakingRequest = req.user;

   // Periksa apakah pengguna yang membuat permintaan adalah admin
   if (userMakingRequest.role !== 'admin') {
      return res.status(403).json({ error: 'Only admins can update rooms' });
   }
   try {
    // Find the room to be updated
    const roomToUpdate = await prisma.room.findUnique({
      where: { id: parseInt(req.params.id) },
    });

    if (!roomToUpdate) {
      return res.status(404).json({ error: 'Room not found' });
    }

    // Check if the room to be updated is soft-deleted
    if (roomToUpdate.deletedAt) {
      return res.status(403).json({ error: 'Cannot update a deleted room' });
    }
      // Periksa apakah ruangan dengan nama yang sama sudah ada (kecuali ruangan yang sedang diperbarui)
      const existingRoom = await prisma.room.findFirst({
         where: {
         name,
         NOT: { id: parseInt(req.params.id) }
         },
      });

      if (existingRoom) {
         return res.status(409).json({ error: 'Room with this name already exists' });
      }

      // Perbarui ruangan
      const updatedRoom = await prisma.room.update({
         where: {
         id: parseInt(req.params.id),
         },
         data: { name, capacity },
      });

      res.status(200).json({
         success: true,
         message: "Room updated successfully",
         data: updatedRoom,
      });
   } catch (error) {
      next(error);
   }
};

const deleteRoom = async (req, res, next) => {
  try {
      const userMakingRequest = req.user;
      // Periksa apakah pengguna yang membuat permintaan adalah admin
      if (userMakingRequest.role !== 'admin') {
         return res.status(403).json({ error: 'Only admins can update rooms' });
      }
    // Temukan inventory berdasarkan inventoryId
    const room = await prisma.room.findUnique({
      where: { id: parseInt(req.params.id),deletedAt: null },
    });

    // Jika inventory tidak ditemukan
    if (!room) {
      return res.status(404).json({ error: 'Ruangan not found or invalid inventory ID' });
    }
      const deletedRoom = await prisma.room.update({
         where: { id: parseInt(req.params.id), },
         data: { deletedAt: new Date() },
      });
      res.status(200).json({
         success: true,
         message: "Room deleted successfully",
         data: deletedRoom,
      });
   } catch (error) {
      next(error);
   }
};

// rent a room
const startRoomRent = async (req, res, next) => {
  try {
    const { userId, capacity, notes, condition } = req.body;
    const RoomId = parseInt(req.params.id);

    // Validate the token and get the logged-in user's role
    const loggedInUser = req.user;

    if (!loggedInUser) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Fetch the user details from the request body
    const user = await prisma.user.findUnique({
      where: { userId: parseInt(userId) },
    });
    // Check if the user is soft-deleted
    if (user.deletedAt) {
      return res.status(403).json({ error: 'Deleted users cannot rent rooms' });
    }
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const isadmin = req.user.role === 'teacher' || req.user.role === 'admin';
    if (!isadmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Only teachers and admin can rent rooms",
        data: null,
      });
    }

    // Check if the user is already renting a room
    const existingRental = await prisma.roomRent.findFirst({
      where: {
        userId: parseInt(userId),
        endTime: null,
      },
    });

    if (existingRental) {
      return res.status(400).json({ error: 'User is already renting a room' });
    }

    // Check if the room is already rented
    const availableRoom = await prisma.room.findUnique({
      where: { 
         id: RoomId,
      },
    });

    if (!availableRoom || availableRoom.deletedAt) {
      return res.status(404).json({ error: 'Room not found or has been deleted' });
    }

    if (availableRoom.isRented ) {
      return res.status(404).json({ error: 'Room has already been rented' });
    }

    // Start room rent
    const rentedRoom = await prisma.roomRent.create({
      data: {
        RoomId,
        userId: parseInt(userId),
        capacity,
        startTime: new Date(), // Automatically set the start time to current date
        condition,
        notes,
      },
      include: {
        user: true,
      },
    });

    await prisma.room.update({
      where: { id: RoomId },
      data: {
        isRented: true,
      },
    });

    res.status(200).json({
      success: true,
      message: "Room rented successfully",
      data:{
        ...rentedRoom,
        user: {
          username: rentedRoom.user.username,
          nip: rentedRoom.user.nip,
        },
        room: {
          name: availableRoom.name,
          capacity: availableRoom.capacity,
        }
      }
    });
  } catch (error) {
    next(error);
  }
};


// End a room rent
const endRoomRent = async (req, res, next) => {
  try {
    const { userId, condition, notes } = req.body;
    const RoomId = parseInt(req.params.id);

    // Find the most recent active rent record based on rentId and userId
    const rentRecord = await prisma.roomRent.findFirst({
      where: {
      //   id: RoomId,
        userId: parseInt(userId),
        RoomId,
        endTime: null, // Ensure we only find the active rental
      },
      orderBy: {
        startTime: 'desc', // Ensure we get the most recent rental
      },
      include: {
        user: true,
        Room: true,
      }
    });

    if (!rentRecord) {
      return res.status(404).json({ error: 'Rent record not found' });
    }

    const rentedRoom = await prisma.roomRent.update({
      where: { id: rentRecord.id },
      data: {
        endTime: new Date(),
        condition,
        notes,
      }
    });

    await prisma.room.update({
      where: { id: RoomId },
      data: { isRented: false },
    });
    const response = {
      ...rentedRoom,
      user: {
        username: rentRecord.user.username,
        nip: rentRecord.user.nip,
      },
    Room: {name:rentRecord.Room.name
      ,capacity:rentRecord.Room.capacity
    },
    };

    res.status(200).json({
      success: true,
      message: "Room rent ended successfully",
      data: response,
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createRoom,
  getRooms,
  getAllRooms,
  getALLRoomsRent,
  updateRoom,
  deleteRoom,
  getRoomById,
  startRoomRent,
  endRoomRent
};
