// Load environment variables from .env file
require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const bodyParser = require('body-parser');
const path = require('path');
const helmet = require('helmet');
const Joi = require('joi');

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(helmet()); // Secure HTTP headers
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON payloads
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded payloads
app.use(express.static(path.join(__dirname, 'public'))); // Serve static files from 'public' directory

// Serve index.html for the root route
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI)
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB connection error:', err));

mongoose.connection.on('error', (err) => console.error('MongoDB connection error:', err));
mongoose.connection.on('disconnected', () => console.warn('MongoDB disconnected!'));

// User schema and model
const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true }
});
const User = mongoose.model('User', userSchema);

// Validation schemas
const signupSchema = Joi.object({
    name: Joi.string().min(3).required(),
    email: Joi.string().email().required(),
    password: Joi.string().min(8).required()
});

const loginSchema = Joi.object({
    email: Joi.string().email().required(),
    password: Joi.string().required()
});

// Routes
app.post('/signup', async (req, res) => {
    const { error } = signupSchema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { name, email, password } = req.body;

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(409).send('Email already registered.');

        const hashedPassword = await bcrypt.hash(password, 10);
        const user = new User({ name, email, password: hashedPassword });
        await user.save();

        res.status(201).send('User registered successfully.');
    } catch (err) {
        console.error('Signup Error:', err);
        res.status(500).send('Failed to register user.');
    }
});

app.post('/login', async (req, res) => {
    const { error } = loginSchema.validate(req.body);
    if (error) return res.status(400).send(error.details[0].message);

    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email });
        if (!user) return res.status(401).send('Invalid email or password.');

        const passwordMatch = await bcrypt.compare(password, user.password);
        if (!passwordMatch) return res.status(401).send('Invalid email or password.');

        res.status(200).send('Login successful!');
    } catch (err) {
        console.error('Login Error:', err);
        res.status(500).send('Internal server error.');
    }
});

// Delivery person's location mock
let deliveryPersonLocation = {
    latitude: -1.286389,
    longitude: 36.817223
};

app.get('/api/location', (req, res) => {
    res.json(deliveryPersonLocation);
});

app.post('/api/location/update', (req, res) => {
    const { latitude, longitude } = req.body;

    if (latitude && longitude) {
        deliveryPersonLocation = { latitude, longitude };
        res.status(200).send('Location updated successfully.');
    } else {
        res.status(400).send('Invalid location data.');
    }
});

// Start the server
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});
