const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const { requireAuth } = require('../middleware/auth');

const dataPath = path.join(__dirname, '../data/portfolio.json');

// Helper function to read data
function readData() {
    const data = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(data);
}

// Helper function to write data
function writeData(data) {
    fs.writeFileSync(dataPath, JSON.stringify(data, null, 2), 'utf8');
}

// Login page
router.get('/login', (req, res) => {
    if (req.session.isAdmin) {
        return res.redirect('/admin');
    }
    res.render('admin/login', { error: null });
});

// Handle login
router.post('/login', (req, res) => {
    const { username, password } = req.body;
    const data = readData();

    if (username === data.admin.username && password === data.admin.password) {
        req.session.isAdmin = true;
        req.session.username = username;
        res.redirect('/admin');
    } else {
        res.render('admin/login', { error: 'Username atau password salah!' });
    }
});

// Logout
router.get('/logout', (req, res) => {
    req.session.destroy();
    res.redirect('/admin/login');
});

// Dashboard (protected)
router.get('/', requireAuth, (req, res) => {
    const data = readData();
    res.render('admin/dashboard', {
        data,
        username: req.session.username
    });
});

// Edit page for specific section (protected)
router.get('/edit/:section', requireAuth, (req, res) => {
    const section = req.params.section;
    const data = readData();
    res.render('admin/edit', {
        section,
        data,
        username: req.session.username
    });
});

// Save data (protected)
router.post('/save', requireAuth, (req, res) => {
    try {
        const data = readData();
        const { section, itemData } = req.body;

        if (section === 'profile') {
            data.profile = itemData;
        } else if (Array.isArray(data[section])) {
            // For arrays (education, experience, projects, etc.)
            if (itemData.id) {
                // Update existing
                const index = data[section].findIndex(item => item.id === itemData.id);
                if (index !== -1) {
                    data[section][index] = itemData;
                }
            } else {
                // Add new
                itemData.id = section + Date.now();
                data[section].push(itemData);
            }
        } else if (section === 'skills' || section === 'certifications' || section === 'publications') {
            // For simple arrays
            data[section] = itemData;
        }

        writeData(data);
        res.json({ success: true, message: 'Data berhasil disimpan!' });
    } catch (error) {
        res.json({ success: false, message: 'Gagal menyimpan data: ' + error.message });
    }
});

// Delete item (protected)
router.post('/delete/:section/:id', requireAuth, (req, res) => {
    try {
        const { section, id } = req.params;
        const data = readData();

        if (Array.isArray(data[section])) {
            data[section] = data[section].filter(item => item.id !== id);
            writeData(data);
            res.json({ success: true, message: 'Data berhasil dihapus!' });
        } else {
            res.json({ success: false, message: 'Section tidak valid!' });
        }
    } catch (error) {
        res.json({ success: false, message: 'Gagal menghapus data: ' + error.message });
    }
});

module.exports = router;
