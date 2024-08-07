const prisma = require("../libs/prisma");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
// const prisma = require("../libs/prisma");
require("dotenv").config();

const loggedOutTokens = [];
const authenticateUser = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  const token = authHeader?.split(" ")[1];

  if (!token) return res.sendStatus(401);

  // Check if the token is in the logged out tokens list
  if (loggedOutTokens.includes(token)) {
    return res.status(401).json({ success: false, message: "Please log in again." });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      if (err.name === 'TokenExpiredError') {
        return res.status(401).json({ success: false, message: "Token has expired." });
      }
      return res.sendStatus(403);
    }

    req.user = decoded;
    next();
  });
};

const createRoom = async (req, res, next) => {
  try {
    // Pastikan user terotentikasi dan data user tersedia di req.user
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
        data: null,
      });
    }

    // Periksa apakah user memiliki peran super_admin atau admin
    const isadmin = req.user.role === 'super_admin' || req.user.role === 'admin';
    if (!isadmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Only super_admin and admin can create rooms",
        data: null,
      });
    }

    // Ambil data yang diperlukan dari body atau request
    const { name, capacity } = req.body;

    // Buat room baru menggunakan Prisma
    const newRoom = await prisma.room.create({
      data: {
        name,
        capacity,
        userId: req.user.userId, // Menggunakan userId dari req.user
      },
    });

    // Mengembalikan respons sukses dengan data room yang baru dibuat
    return res.status(201).json({
      success: true,
      message: "Room created successfully",
      data: newRoom,
    });
  } catch (error) {
    next(error); // Tangani error dengan middleware error handling
  }
};

// Get all rooms
const getRooms = async (req, res, next) => {
  try {
    const rooms = await prisma.room.findMany({
      include: { schedules: true, user: true },
    });

    res.status(200).json({
      success: true,
      message: 'Rooms retrieved successfully',
      data: rooms,
    });
  } catch (error) {
    next(error);
  }
};

// Get a single room by ID
const getRoomById = async (req, res, next) => {
  try {
    const { id } = req.params;

    const room = await prisma.room.findUnique({
      where: { roomId: parseInt(id, 10) },
      include: { schedules: true, user: true },
    });

    if (!room) {
      return res.status(404).json({
        success: false,
        message: 'Room not found',
        data: null,
      });
    }

    res.status(200).json({
      success: true,
      message: 'Room retrieved successfully',
      data: room,
    });
  } catch (error) {
    next(error);
  }
};

// Update a room
const updateRoom = async (req, res, next) => {
  try {
    // Pastikan user terotentikasi dan data user tersedia di req.user
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
        data: null,
      });
    }

    // Periksa apakah user memiliki peran super_admin atau admin
    const isadmin = req.user.role === 'super_admin' || req.user.role === 'admin';
    if (!isadmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Only super_admin and admin can update rooms",
        data: null,
      });
    }

    const { id } = req.params;
    const { name, capacity } = req.body;

    const updatedRoom = await prisma.room.update({
      where: { roomId: parseInt(id, 10) },
      data: {
        name,
        capacity,
      },
    });

    res.status(200).json({
      success: true,
      message: 'Room updated successfully',
      data: updatedRoom,
    });
  } catch (error) {
    next(error);
  }
};

// Delete a room
const deleteRoom = async (req, res, next) => {
  try {
    // Pastikan user terotentikasi dan data user tersedia di req.user
    if (!req.user || !req.user.userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: User not authenticated",
        data: null,
      });
    }

    // Periksa apakah user memiliki peran super_admin atau admin
    const isadmin = req.user.role === 'super_admin' || req.user.role === 'admin';
    if (!isadmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Only super_admin and admin can delete rooms",
        data: null,
      });
    }

    const { id } = req.params;

    await prisma.room.delete({
      where: { roomId: parseInt(id, 10) },
    });

    res.status(200).json({
      success: true,
      message: 'Room deleted successfully',
      data: null,
    });
  } catch (error) {
    next(error);
  }
};


module.exports = {
  createRoom,
  getRooms,
  getRoomById,
  updateRoom,
  deleteRoom,
  authenticateUser,
  loggedOutTokens
};
