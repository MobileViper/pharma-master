// Load environment variables from .env file
require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors"); // Import CORS
const bcrypt = require('bcrypt'); // Import bcrypt for password hashing
const bodyParser = require('body-parser'); // Import body-parser for parsing URL-encoded data
const mailgun = require("mailgun-js"); // Import Mailgun

const app = express();
const PORT = process.env.PORT || 4000; // Use port from environment variable or default to 4000
const path = require("path");

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
    email: { type: String, required: true, unique: true }, // Ensure email is unique
    password: { type: String, required: true }
});

const User = mongoose.model("User", userSchema);

// Fetch all users (for debugging or admin purposes)
app.get("/users", async (req, res) => {
    try {
        const users = await User.find();
        res.json(users);
    } catch (error) {
        console.error("Error fetching users:", error);
        res.status(500).json({ message: "Failed to fetch users." });
    }
});

// Signup Route
app.post("/signup", async (req, res) => {
    const { name, email, password } = req.body;
    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(409).send("Email already registered."); // 409 Conflict
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
    const { email, password } = req.body; // Use email instead of username

    try {
        // Check if user exists in the database
        const user = await User.findOne({ email }); // Find user by email

        // Check if the user was found
        if (!user) {
            return res.status(404).json({ message: 'User not found.' }); // 404 Not Found
        }

        // Log login data and user information
        console.log("Login Data:", req.body);
        console.log("User Retrieved:", user);
        
        // Compare hashed password
        const passwordMatch = await bcrypt.compare(password, user.password);
        console.log("Password Comparison Result:", passwordMatch);

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

// Initialize Mailgun
const mg = mailgun({
    apiKey: process.env.MAILGUN_API_KEY,
    domain: process.env.MAILGUN_DOMAIN,
});

// POST route for contact form submission
app.post('/contact', (req, res) => {
    const { c_fname, c_lname, c_email, c_subject, c_message } = req.body;

    // Email options
    const data = {
        from: process.env.EMAIL_USER,
        to: c_email, // Send a response to the user's email
        subject: `Feedback from ${c_fname} ${c_lname}: ${c_subject}`,
        text: `You have received a new message:\n\nName: ${c_fname} ${c_lname}\nEmail: ${c_email}\nMessage: ${c_message}`
    };

    // Send email using Mailgun
    mg.messages().send(data, (error, body) => {
        if (error) {
            console.error('Error sending email:', error);
            return res.status(500).send('Error sending email: ' + error.message);
        }
        console.log('Email sent: ', body);
        res.status(200).send('Message sent successfully');
    });
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

// Example: Update delivery person's location (this could come from your delivery app)
app.post('/api/location/update', (req, res) => {
    const { latitude, longitude } = req.body;

    // Update the delivery person's location
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
