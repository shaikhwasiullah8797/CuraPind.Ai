const express = require('express');
const router = express.Router();
const dbStore = require('../dbStore');
const { auth, authorize } = require('../middleware/auth');

// @route   GET api/admin/users
// @desc    Get all users
router.get('/users', auth, authorize(['Admin']), async (req, res) => {
    try {
        const users = dbStore.users.map(({password, ...u}) => u);
        res.json(users);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET api/admin/reports
// @desc    Get all health reports
router.get('/reports', auth, authorize(['Admin']), async (req, res) => {
    try {
        const reports = dbStore.reports.map(report => {
            const user = dbStore.users.find(u => u.id === report.user);
            return {
                ...report,
                user: { name: user?.name, email: user?.email }
            };
        }).sort((a,b) => b.createdAt - a.createdAt);
        res.json(reports);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;
