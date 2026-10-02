const express = require('express');
const cors = require('cors');
const nodemailer = require('nodemailer');
const path = require('path');
const { initializeApp } = require('firebase/app');
const { getFirestore, collection, addDoc, serverTimestamp } = require('firebase/firestore');

const firebaseConfig = {
    apiKey: "AIzaSyDDDKd9Ec3X7PlEeh9FWOCuJEOa5Vpc2Eo",
    authDomain: "portfolio-8d414.firebaseapp.com",
    projectId: "portfolio-8d414",
    storageBucket: "portfolio-8d414.firebasestorage.app",
    messagingSenderId: "1026452228316",
    appId: "1:1026452228316:web:af5e6fd81c12e76221cc19",
    measurementId: "G-JR983GXVBM"
};

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp);

const app = express();
const PORT = 5000;

// Middleware
app.use(cors());
app.use(express.json());

// Serve static files from Frontend folder
app.use(express.static(path.join(__dirname, '../Frontend')));

// Email configuration
const EMAIL_USER = 'justin.fds2005@gmail.com';
const EMAIL_PASS = 'jepjkquzdunduzjg';

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: EMAIL_USER,
        pass: EMAIL_PASS
    }
});

// Test endpoint
app.get('/api/test', (req, res) => {
    res.json({ success: true, message: 'API is working!' });
});

// Contact form endpoint
app.post('/api/contact', async (req, res) => {
    console.log('\n📨 Contact request received');
    console.log('Body:', req.body);

    try {
        const { name, email, subject, message } = req.body;

        // Validation
        if (!name || name.length < 2) {
            return res.status(400).json({ success: false, message: 'Name must be at least 2 characters' });
        }
        if (!email || !email.includes('@')) {
            return res.status(400).json({ success: false, message: 'Valid email is required' });
        }
        if (!message || message.length < 5) {
            return res.status(400).json({ success: false, message: 'Message must be at least 5 characters' });
        }

        console.log(`Name: ${name}`);
        console.log(`Email: ${email}`);
        console.log(`Subject: ${subject || 'No Subject'}`);

        // Send email to you
        await transporter.sendMail({
            from: EMAIL_USER,
            to: EMAIL_USER,
            subject: `🔔 Portfolio Contact: ${subject || 'New Message'} from ${name}`,
            text: `Name: ${name}\nEmail: ${email}\nSubject: ${subject || 'No Subject'}\n\nMessage:\n${message}\n\nTime: ${new Date().toLocaleString()}`
        });

        // Send auto-reply
        await transporter.sendMail({
            from: EMAIL_USER,
            to: email,
            subject: 'Thank you for contacting Justin Fernandes',
            text: `Hi ${name},\n\nThank you for reaching out! I've received your message and will get back to you within 24-48 hours.\n\nBest regards,\nJustin Fernandes\nMean Stack Developer & Cybersecurity Enthusiast`
        });

        console.log('✅ Emails sent successfully');

        // Save to Firebase Firestore
        try {
            const docRef = await addDoc(collection(db, "contacts"), {
                name,
                email,
                subject: subject || 'No Subject',
                message,
                timestamp: serverTimestamp()
            });
            console.log("✅ Document written to Firebase with ID: ", docRef.id);
        } catch (e) {
            console.error("❌ Error adding document to Firebase: ", e);
            // Non-fatal error, we still want to return success for email
        }

        res.json({
            success: true,
            message: 'Your message has been sent successfully! I\'ll get back to you soon.'
        });

    } catch (error) {
        console.error('❌ Error:', error.message);
        res.status(500).json({
            success: false,
            message: 'Server error. Please try again or email me directly at justin.fds2005@gmail.com'
        });
    }
});

// Serve index.html for all other routes
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, '../Frontend', 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
    console.log('\n========================================');
    console.log('🚀 JUSTIN FERNANDES PORTFOLIO SERVER');
    console.log('========================================');
    console.log(`✅ Server running at:`);
    console.log(`   http://localhost:${PORT}`);
    console.log(`   http://127.0.0.1:${PORT}`);
    console.log('========================================');
    console.log('📧 Email notifications: ACTIVE');
    console.log('========================================\n');
});