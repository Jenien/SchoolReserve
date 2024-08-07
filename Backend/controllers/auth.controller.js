const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const prisma = require("../libs/prisma");
require("dotenv").config();
const {
  createUserSchema,
  loginSchema,
  forgotPasswordSchema,
  changePasswordSchema,
} = require("../validation/auth.validations");

// In-memory storage for logged out tokens
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


const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    // Validasi input login menggunakan schema
    const { value, error } = await loginSchema.validateAsync({ email, password });
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Bad Request",
        err: error.message,
        data: null,
      });
    }

    // Periksa user di database
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: null,
      });
    }

    // Verifikasi password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Wrong email or password",
        data: null,
      });
    }

    // Buat payload token JWT dengan informasi pengguna
    const payload = {
      userId: user.userId,
      email: user.email,
      username: user.username,
      role: user.role,
    };

    // Menghasilkan token JWT dengan menggunakan JWT_SECRET dari environment
    const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: "1d" });

    // Mengembalikan token JWT dan profil pengguna dalam respons
    return res.status(200).json({
      success: true,
      message: "Login successful",
      data: {
        token,
        profile: payload,
      },
    });
  } catch (error) {
    next(error); // Menangani error dengan middleware error handling
  }
};


const registerUser = async (req, res, next) => {
  try {
    const { email, password, username } = req.body; // Hapus role dari sini

    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        message: "Bad Request",
        err: "Missing required fields",
        data: null,
      });
    }

    const { value, error } = await createUserSchema.validateAsync({
      email,
      password,
      username,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Bad Request",
        err: error.message,
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

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: { email, password: hashedPassword, username,role: 'user', }, // Hapus role dari sini
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
      },
    });
  } catch (error) {
    next(error);
  }
};

const registerSU = async (req, res, next) => {
  try {
    const { email, password, username } = req.body;

    if (!email || !password || !username) {
      return res.status(400).json({
        success: false,
        message: "Bad Request",
        err: "Missing required fields",
        data: null,
      });
    }

    const { value, error } = await createUserSchema.validateAsync({
      email,
      password,
      username,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Bad Request",
        err: error.message,
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

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        role: "super_admin",
      },
    });

    if (!newUser) {
      return res.status(500).json({
        success: false,
        message: "Failed to register user",
        data: null,
      });
    }

    return res.status(201).json({
      success: true,
      message: "User registered successfully",
      data: {
        userId: newUser.userId,
        email: newUser.email,
        username: newUser.username,
        role: newUser.role,
      },
    });
  } catch (error) {
    next(error);
  }
};

const registeradmin = async (req, res, next) => {
  try {
    const { email, password, username } = req.body;

    const { value, error } = await createUserSchema.validateAsync({
      email,
      password,
      username,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Bad Request",
        err: error.message,
        data: null,
      });
    }

    const isadmin = req.user.role === "super_admin";
    if (!isadmin) {
      return res.status(403).json({
        success: false,
        message: "Forbidden: Only super_admin can register admins",
        data: null,
      });
    }

    const existingadmin = await prisma.user.findUnique({ where: { email } });
    if (existingadmin) {
      return res.status(409).json({
        success: false,
        message: "admin already exists",
        data: null,
      });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newadmin = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        username,
        role: "admin",
      },
    });

    return res.status(201).json({
      success: true,
      message: "admin registered successfully",
      data: { adminId: newadmin.userId },
    });
  } catch (error) {
    next(error);
  }
};

const forgotPassword = async (req, res, next) => {
  try {
    const { email, newPassword } = req.body;

    const { value, error } = await forgotPasswordSchema.validateAsync({
      email,
      newPassword,
    });

    if (error) {
      return res.status(400).json({
        success: false,
        message: "Bad Request",
        err: error.message,
        data: null,
      });
    }

    const user = await prisma.user.findUnique({ where: { email } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: null,
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      success: true,
      message: "Password reset successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  try {
    const { oldPassword, newPassword } = req.body;

    const { value, error } = await changePasswordSchema.validateAsync({
      oldPassword,
      newPassword,
    });
    if (error) {
      return res.status(400).json({
        success: false,
        message: "Bad Request",
        err: error.message,
        data: null,
      });
    }

    const userId = req.user.userId;
    const user = await prisma.user.findUnique({ where: { userId } });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
        data: null,
      });
    }

   
    const isMatch = await bcrypt.compare(oldPassword, user.password);

    if (!isMatch) {
      return res.status(400).json({
        success: false,
        message: "Wrong old password",
        data: null,
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await prisma.user.update({
      where: { userId },
      data: { password: hashedPassword },
    });

    return res.status(200).json({
      success: true,
      message: "Password changed successfully",
      data: null,
    });
  } catch (error) {
    next(error);
  }
};

const logout = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader?.split(" ")[1];

    if (!token) {
      return res.status(400).json({
        success: false,
        message: "No token provided",
        data: null,
      });
    }

    // Verify token
    jwt.verify(token, process.env.JWT_SECRET, async (err, decoded) => {
      if (err) {
        return res.status(403).json({
          success: false,
          message: "Invalid token",
          data: null,
        });
      }

      // Add token to the logged out tokens list
      loggedOutTokens.push(token);

      return res.status(200).json({
        success: true,
        message: "Logged out successfully",
        data: null,
      });
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  registerUser,
  registerSU,
  registeradmin,
  forgotPassword,
  changePassword,
  logout,
  authenticateUser,
};
