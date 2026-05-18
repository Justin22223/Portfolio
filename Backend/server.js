// server.js - Complete Backend with MongoDB + Email Notifications
// For Justin Fernandes Portfolio

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const nodemailer = require('nodemailer');

const app = express();
const PORT = 5000;

// ============================================
// CONFIGURATION
// ============================================

// MongoDB Connection (Local)
const MONGODB_URI = 'mongodb://localhost:27017/justin_portfolio';

// Email Configuration
const EMAIL_USER = 'justin.fds2005@gmail.com';
const EMAIL_PASS = 'jozdzlhmcvuxemxy'; // Your App Password (no spaces)

// ============================================
// MIDDLEWARE
// ============================================
app.use(cors());
app.use(express.json());

// ============================================
// MONGODB SCHEMA
// ============================================
const contactSchema = new mongoose.Schema({
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    subject: { type: String, default: 'No Subject', trim: true },
    message: { type: String, required: true, trim: true },
    createdAt: { type: Date, default: Date.now },
    isRead: { type: Boolean, default: false }
});

const Contact = mongoose.model('Contact', contactSchema);

// ============================================
// EMAIL SETUP
// ============================================
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: { user: EMAIL_USER, pass: EMAIL_PASS }
});

// ============================================
// API ROUTES
// ============================================

// Root endpoint
app.get('/', (req, res) => {
    res.json({
        success: true,
        message: 'Justin Fernandes Portfolio API',
        mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        endpoints: {
            'POST /api/contact': 'Submit contact form',
            'GET /api/messages': 'Get all messages',
            'GET /api/messages/:id': 'Get single message',
            'DELETE /api/messages/:id': 'Delete message'
        }
    });
});

// Submit contact form
app.post('/api/contact', async (req, res) => {
    try {
        const { name, email, subject, message } = req.body;
        
        console.log('\n📨 New submission:', { name, email });
        
        // Validate
        if (!name || name.length < 2) {
            return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
        }
        if (!email || !email.includes('@')) {
            return res.status(400).json({ success: false, message: 'Valid email is required' });
        }
        if (!message || message.length < 5) {
            return res.status(400).json({ success: false, message: 'Message must be at least 5 characters' });
        }
        
        // Save to MongoDB
        const contact = new Contact({ name, email, subject: subject || 'No Subject', message });
        await contact.save();
        console.log('✅ Saved to MongoDB');
        
        // Send email notification
        try {
            // Email to you
            await transporter.sendMail({
                from: EMAIL_USER,
                to: EMAIL_USER,
                subject: `🔔 New message from ${name}`,
                text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject || 'No Subject'}\n\nMessage:\n${message}\n\nTime: ${new Date().toLocaleString()}`
            });
            
            // Auto-reply
            await transporter.sendMail({
                from: EMAIL_USER,
                to: email,
                subject: 'Thank you for contacting Justin Fernandes',
                text: `Hi ${name},\n\nThank you for your message! I will get back to you within 24-48 hours.\n\nBest regards,\nJustin Fernandes`
            });
            console.log('✅ Emails sent');
        } catch (emailError) {
            console.log('⚠️ Email error:', emailError.message);
        }
        
        // Console output
        console.log(`✅ Message from ${name} saved & notified`);
        
        res.json({
            success: true,
            message: 'Your message has been sent successfully!',
            data: { id: contact._id, name: contact.name, createdAt: contact.createdAt }
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
        res.status(500).json({ success: false, message: 'Server error. Please try again.' });
    }
});

// Get all messages
app.get('/api/messages', async (req, res) => {
    try {
        const messages = await Contact.find().sort({ createdAt: -1 });
        res.json({ success: true, count: messages.length, data: messages });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch messages' });
    }
});

// Get single message
app.get('/api/messages/:id', async (req, res) => {
    try {
        const message = await Contact.findById(req.params.id);
        if (!message) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, data: message });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to fetch' });
    }
});

// Delete message
app.delete('/api/messages/:id', async (req, res) => {
    try {
        const deleted = await Contact.findByIdAndDelete(req.params.id);
        if (!deleted) return res.status(404).json({ success: false, message: 'Not found' });
        res.json({ success: true, message: 'Deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Failed to delete' });
    }
});

// ============================================
// START SERVER
// ============================================

// Try to connect to MongoDB, but start server even if it fails
mongoose.connect(MONGODB_URI)
    .then(() => console.log('\n✅ MongoDB Connected successfully!'))
    .catch(err => console.log('\n⚠️ MongoDB not running:', err.message));

app.listen(PORT, () => {
    console.log('\n========================================');
    console.log(`🚀 Server running on http://localhost:${PORT}`);
    console.log('========================================');
    console.log('📧 Email: justin.fds2005@gmail.com');
    console.log('💾 MongoDB: localhost:27017/justin_portfolio');
    console.log('========================================\n');
});