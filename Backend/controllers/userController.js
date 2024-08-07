const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

const registerSU = async (req, res, next) => {
  try {
    const { email, password, username,nip } = req.body;

    if (!email || !password || !username || !nip) {
      return res.status(400).json({
        success: false,
        message: "Bad Request",
        err: "Missing required fields",
        data: null,
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already in use",
        data: null,
      });
    }
    const existingNip = await prisma.user.findUnique({ where: { nip } });
    if (existingNip) {
      return res.status(409).json({
        success: false,
        message: "NIP already in use",
        data: null,
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        role: "admin",
        nip 
      },
    });

    if (!newUser) {
      return res.status(500).json({
        success: false,
        message: "Failed to register admin",
        data: null,
      });
    }

    return res.status(201).json({
      success: true,
      message: "A Admin registered successfully",
      data: {
        userId: newUser.userId,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        nip: newUser.nip
      },
    });
  } catch (error) {
    next(error);
  }
};

const registerUser = async (req, res, next) => {
  try {
    const { email, password, username, nip } = req.body;

    if (!email || !password || !username || !nip) {
      return res.status(400).json({
        success: false,
        message: "Bad Request",
        err: "Missing required fields",
        data: null,
      });
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already in use",
        data: null,
      });
    }

    const existingNip = await prisma.user.findUnique({ where: { nip } });
    if (existingNip) {
      return res.status(409).json({
        success: false,
        message: "NIP already in use",
        data: null,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { email, password: hashedPassword, username, role :"student", nip },
    });

    if (!newUser) {
      return res.status(500).json({
        success: false,
        message: "Failed to register user",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "User registered successfully",
      data: {
        userId: newUser.userId,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        nip: newUser.nip
      },
    });
  } catch (error) {
    next(error);
  }
};
const registerTeacher = async (req, res, next) => {
  try {
    const { email, password, username, nip } = req.body;

    if (!email || !password || !username || !nip) {
      return res.status(400).json({
        success: false,
        message: "Bad Request",
        err: "Missing required fields",
        data: null,
      });
    }

    const isadmin = req.user.role === "admin";
    if (!isadmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Only admin can register teacher",
        data: null,
      });
    }
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "Email already in use",
        data: null,
      });
    }

    const existingNip = await prisma.user.findUnique({ where: { nip } });
    if (existingNip) {
      return res.status(409).json({
        success: false,
        message: "NIP already in use",
        data: null,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { email, password: hashedPassword, username, role :"teacher", nip },
    });

    if (!newUser) {
      return res.status(500).json({
        success: false,
        message: "Failed to register user",
        data: null,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Teacher registered successfully",
      data: {
        userId: newUser.userId,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
        nip: newUser.nip
      },
    });
  } catch (error) {
    next(error);
  }
};

const login = async (req, res, next) => {
  try {
    const { email, password, nip, username } = req.body;

    // console.log(req.body);    
    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email },
          { nip },
          { username },
        ]
      },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: null,
      });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Wrong Nip or email or password",
        data: null,
      });
    }

    const payload = {
      userId: user.userId,
      email: user.email,
      username: user.username,
      role: user.role,
      nip: user.nip
    };

    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });

    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        profile: payload,
      },
    });
  } catch (error) {
    next(error);
  }
};

// Get a single user by ID
const getUserById = async (req, res, next) => {
   try {
      const user = await prisma.user.findUnique({
         where: {
            userId: parseInt(req.params.id),
         },
      });

      res.json(user);
   } catch (error) {
      next(error);
   }

}

// Get all users
const getUsers = async (req, res, next) => {
   try {
      // Check if user role is admin
      // console.log(req.user);
      const isadmin = req.user.role === "admin";
      if (!isadmin) {
         return res.status(403).json({
         success: false,
         message: "Forbidden: Only admins can access this feature",
         data: null,
         });
      }

      // Fetch users
      const users = await prisma.user.findMany({
         where: {
         deletedAt: null,
         },
      });
      res.json(users);
   } catch (error) {
      next(error);
   }
};

const getAllUsers = async (req, res, next) => {
  try {
    // Check if user role is admin
    const isadmin = req.user.role === "admin";
    if (!isadmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Only admins can access this feature",
        data: null,
      });
    }

    // Fetch users including those with deletedAt not null
    const users = await prisma.user.findMany();

    res.json(users);
  } catch (error) {
    next(error);
  }
};
// Update a user
const updateUser = async (req, res, next) => {
   try {
      const { username, email, nip, password, role } = req.body;
      const userId = parseInt(req.params.id);
      const userMakingRequest = req.user;
      // console.log(userMakingRequest);

      // Temukan pengguna yang akan diperbarui
      const userToUpdate = await prisma.user.findUnique({
         where: { userId },
      });

      if (!userToUpdate) {
         return res.status(404).json({ error: 'User not found' });
      }

      // Periksa apakah pengguna yang membuat permintaan adalah admin atau pengguna yang bersangkutan
      if (userMakingRequest.userId !== userId && userMakingRequest.role !== 'admin') {
         return res.status(403).json({ error: 'Only the user or an admin can update user data' });
      }
      

      const updatedUser = await prisma.user.update({
         where: {
         userId,
         },
         data: {
         username,
         email,
         nip,
         password: await bcrypt.hash(password, 10),
         role,
         },
      });

      res.json({
         success: true,
         message: 'User updated successfully',
         data: updatedUser,
      });
   } catch (error) {
      next(error);
   }
}

// Soft delete a user
const deleteUser = async (req, res, next) => {
   try {

    const isadmin = req.user.role === 'teacher' || req.user.role === 'admin';
    if (!isadmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Only teachers and admin can access",
        data: null,
      });
    }
      const user = await prisma.user.update({
         where: {
            userId: parseInt(req.params.id),
         },
         data: {
            deletedAt: new Date(),
         },
      });
      res.json(user);
   } catch (error) {
      next(error);
   }
}


module.exports = { registerSU,registerUser,registerTeacher, login, getUserById, getUsers, updateUser, deleteUser, getAllUsers };
