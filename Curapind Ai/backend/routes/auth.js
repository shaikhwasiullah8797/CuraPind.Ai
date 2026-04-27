const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const dbStore = require('../dbStore');
const { auth } = require('../middleware/auth');
const crypto = require('crypto');

// @route   POST api/auth/register
// @desc    Register a user
router.post('/register', async (req, res) => {
    const { name, email, password, role } = req.body;

    try {
        let user = dbStore.users.find(u => u.email === email);

        if (user) {
            return res.status(400).json({ msg: 'User already exists' });
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        user = {
            _id: crypto.randomBytes(16).toString('hex'),
            id: crypto.randomBytes(16).toString('hex'),
            name,
            email,
            password: hashedPassword,
            role: role || 'User',
            createdAt: new Date()
        };

        dbStore.users.push(user);

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret123',
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = dbStore.users.find(u => u.email === email);

        if (!user) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const isMatch = await bcrypt.compare(password, user.password);

        if (!isMatch) {
            return res.status(400).json({ msg: 'Invalid Credentials' });
        }

        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET || 'secret123',
            { expiresIn: '5h' },
            (err, token) => {
                if (err) throw err;
                res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server error');
    }
});

// @route   GET api/auth/me
// @desc    Get user data
router.get('/me', auth, async (req, res) => {
    try {
        const user = dbStore.users.find(u => u.id === req.user.id);
        if(!user) return res.status(404).json({msg: 'User not found'});
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   PUT api/auth/profile
// @desc    Update user profile data (e.g. Profile Image)
router.put('/profile', auth, async (req, res) => {
    const { profileImage } = req.body;
    try {
        const userIndex = dbStore.users.findIndex(u => u.id === req.user.id);
        if (userIndex === -1) {
            return res.status(404).json({ msg: 'User not found' });
        }

        if (profileImage) {
            dbStore.users[userIndex].profileImage = profileImage;
        }
        if (req.body.role) {
            dbStore.users[userIndex].role = req.body.role;
        }

        const { password, ...updatedUser } = dbStore.users[userIndex];
        res.json(updatedUser);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
