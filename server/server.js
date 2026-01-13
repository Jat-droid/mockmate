const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const connectDB = require('./config/db'); // We will create this next
const authRoutes = require('./routes/authRoutes');
const aiRoutes = require('./routes/aiRoutes');
dotenv.config();
connectDB();

const app = express();

// Middleware
app.use(express.json());
app.use(cors({
  // Allow both default Vite port AND the fallback port
  origin: ["http://localhost:5173", "http://localhost:5174"],
  credentials: true
}));

// Test Route
app.get('/', (req, res) => res.send('MockMate API is Running...'));

// Routes (Uncomment these after you copy your files)
app.use('/api/auth', require('./routes/authRoutes'));
app.use('/api/ai', aiRoutes);

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));