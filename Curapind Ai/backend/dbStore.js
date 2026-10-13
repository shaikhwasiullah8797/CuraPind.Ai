// Persistent In-Memory Database Store for MVP
const fs = require('fs');
const path = require('path');

const STORE_FILE = path.join(__dirname, 'data_store.json');

const defaultStore = {
    users: [
        {
            id: 'demo_worker',
            _id: 'demo_worker',
            name: 'Dr. Asha Devi (ASHA Worker)',
            email: 'asha@curapind.com',
            // Default pre-hashed demo password
            password: '$2a$10$wT8B1c2Q7fM.m1hK5.L6se2C1QY6B5V7xQj7i6P7Y8Z9a0B1c2D3e',
            role: 'Health Worker',
            createdAt: new Date().toISOString()
        }
    ],
    reports: []
};

let dbStore = { ...defaultStore };

// Load persistent data if exists
try {
    if (fs.existsSync(STORE_FILE)) {
        const raw = fs.readFileSync(STORE_FILE, 'utf8');
        const parsed = JSON.parse(raw);
        dbStore = {
            users: parsed.users || defaultStore.users,
            reports: parsed.reports || []
        };
    }
} catch (e) {
    console.warn('Could not read data_store.json, using in-memory store:', e.message);
}

// Auto-save on process exit or periodic
const saveStore = () => {
    try {
        fs.writeFileSync(STORE_FILE, JSON.stringify(dbStore, null, 2), 'utf8');
    } catch (e) {
        console.warn('Could not persist data_store.json:', e.message);
    }
};

process.on('SIGINT', () => { saveStore(); process.exit(); });
process.on('SIGTERM', () => { saveStore(); process.exit(); });

module.exports = dbStore;
