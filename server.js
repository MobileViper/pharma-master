// Load environment variables from .env file
require('dotenv').config(); // Load environment variables
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const bcrypt = require('bcrypt');
const bodyParser = require('body-parser');
const path = require("path");

const app = express();
const PORT = process.env.PORT || 4000;

// Serve static files from the public directory
app.use(express.static(path.join(__dirname, 'public')));

// Fallback route to serve index.html for unmatched routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Middleware to enable CORS for all routes
app.use(cors());

// Middleware to parse JSON
app.use(express.json());

// Middleware to parse URL-encoded data
app.use(bodyParser.urlencoded({ extended: true }));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log("MongoDB connected"))
    .catch(err => console.error("MongoDB connection error:", err));

// User schema and model
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});

const User = mongoose.model("User", userSchema);

// Signup Route
app.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).send("Email already registered.");
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();
        res.status(201).send("User registered successfully.");
    } catch (error) {
        console.error("Signup Error:", error);
        res.status(500).send("Failed to register user.");
    }
});

// Login Route
app.post("/login", async (req, res) => {
    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });

        if (!user) {
            return res.status(404).json({ message: 'User not found.' });
        }

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (passwordMatch) {
            res.status(200).json({ message: 'Login successful!' });
        } else {
            res.status(401).json({ message: 'Invalid email or password.' });
        }
    } catch (error) {
        console.error("Login Error:", error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Mock location data for demonstration purposes
let deliveryPersonLocation = {
    latitude: -1.286389,
    longitude: 36.817223
};

// Endpoint to get the delivery person's location
app.get('/api/location', (req, res) => {
    res.json(deliveryPersonLocation);
});

// Example: Update delivery person's location
app.post('/api/location/update', (req, res) => {
    const { latitude, longitude } = req.body;

    if (latitude && longitude) {
        deliveryPersonLocation = { latitude, longitude };
        res.status(200).send('Location updated successfully.');
    } else {
        res.status(400).send('Invalid location data.');
    }
});

// Start server
app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
