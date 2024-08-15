const express = require('express');
const bodyParser = require('body-parser');
const userRoutes = require('./routes/userRoutes');
const roomRoutes = require('./routes/roomRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const { authenticateToken } = require('./middlewares/auth');
const  morgan = require('morgan');
const cors = require('cors');

const app = express();
const prisma = require('./libs/prisma');
app.use (morgan('dev'));

// Use CORS middleware
app.use(cors({
  origin: 'http://127.0.0.1:5500', // ganti dengan origin yang diizinkan
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
  allowedHeaders: 'Origin, X-Requested-With, Content-Type, Accept, Authorization'
}));

app.use(bodyParser.json());

app.use('/api/users', userRoutes);
app.use('/api/rooms',authenticateToken, roomRoutes);
app.use('/api/inventories',authenticateToken, inventoryRoutes);

app.get('/', (req, res) => {
  res.send('Hello World!');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});

module.exports = app;