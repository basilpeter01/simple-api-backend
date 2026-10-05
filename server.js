const express = require('express');
const cors = require('cors');
const crypto = require('crypto');
const fs = require('fs/promises');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// PERSISTENT DATA HELPERS
const DATA_DIR = path.join(__dirname, 'data');
const PARTS_FILE = path.join(DATA_DIR, 'parts.json');
const CLIENTS_FILE = path.join(DATA_DIR, 'clients.json');
const ORDERS_FILE = path.join(DATA_DIR, 'orders.json');

async function loadData(filePath, defaultData = []) {
    try {
        const data = await fs.readFile(filePath, 'utf-8');
        return JSON.parse(data);
    } catch (err) {
        if (err.code === 'ENOENT') {
            await fs.mkdir(DATA_DIR, { recursive: true });
            await fs.writeFile(filePath, JSON.stringify(defaultData, null, 2));
            return defaultData;
        }
        console.error(`Error reading ${filePath}:`, err);
        return defaultData;
    }
}

async function saveData(filePath, data) {
    try {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error(`Error writing to ${filePath}:`, err);
    }
}

let parts = [];
let clients = [];
let orders = [];

// Initialize data
async function initData() {
    parts = await loadData(PARTS_FILE, [
        { id: 1, name: "ESP32", type: "controller", available: true },
        { id: 2, name: "PIR Sensor", type: "sensor", available: true },
        { id: 3, name: "LDR Module", type: "sensor", available: true },
        { id: 4, name: "Raspberry Pi", type: "controller", available: false },
        { id: 5, name: "Arduino uno", type: "controller", available: true },
    ]);
    clients = await loadData(CLIENTS_FILE, []);
    orders = await loadData(ORDERS_FILE, []);
}

//AUTH MIDDLEWARE
const authenticate = (req, res, next) => {
    const authheader = req.headers['authorization'];
    if (!authheader || !authheader.startsWith('Bearer ')) {
        return res.status(401).json({ error: "Missing or invalid authorization header" });
    }

    const token = authheader.split(' ')[1];
    const client = clients.find(c => c.token === token);

    if (!client) {
        return res.status(401).json({ error: "Invalid bearer token" });
    }

    req.userToken = token;
    next();

};

//ROUTES

//root
app.get('/', (req, res) => {
    res.json({ message: "Welcome to the API." });
});

//status
app.get('/status', (req, res) => {
    res.json({ status: "OK" });
});

//register client
app.post('/api-clients', (req, res) => {
    const { clientName, clientEmail } = req.body;

    if (!clientName || !clientEmail) {
        return res.status(400).json({ error: "clientName and clientEmail are required" });
    }

    const exists = clients.some(c => c.clientEmail === clientEmail);
    if (exists) {
        return res.status(409).json({ error: "API client already registered" });
    }

    const token = crypto.randomBytes(32).toString('hex');
    clients.push({ clientName, clientEmail, token });

    res.status(201).json({ accessToken: token });

});

//get all data
app.get('/parts', (req, res) => {
    const { type, limit } = req.query;
    let result = parts;
    if (type) {
        result = result.filter(b => b.type === type);
    }
    if (limit) {
        const limitNum = parseInt(limit);
        if (limitNum > 0 && limitNum <= 20) {
            result = result.slice(0, limitNum);
        }
    }
    res.json(result);
});

//get single part
app.get('/parts/:partId', (req, res) => {
    const part = parts.find(p => p.id === parseInt(req.params.partId));

    if (!part) {
        return res.status(404).json({ error: "No parts with Id " + req.params.partId });
    }
    res.json(part);
});

//place order
app.post('/orders', authenticate, (req, res) => {
    const { partId, customerName } = req.body;

    if (!partId || !customerName) {
        return res.status(400).json({ error: "Id and Name are required." });
    }

    const part = parts.find(p => p.id === parseInt(partId));
    if (!part) return res.status(404).json({ error: "Not found." });

    if (!part.available) {
        return res.status(404).json({ error: "This part is not in stock." });
    }

    const orderId = crypto.randomUUID();
    orders.push({ id: orderId, partId: parseInt(partId), customerName, token: req.userToken });

    res.status(201).json({ created: true, orderId });
});

//get all orders of a user
app.get('/orders', authenticate, (req, res) => {
    const userOrders = orders
        .filter(o => o.token === req.userToken)
        .map(({ token, ...order }) => order);

    res.json(userOrders);
});

//get single order
app.get('/orders/:orderId', authenticate, (req, res) => {
    const order = orders.find(o => o.id === req.params.orderId && o.token === req.userToken);

    if (!order) {
        return res.status(404).json({ error: "No order with id " + req.params.orderId });
    }
    const { token, ...orderData } = order;
    res.json(orderData);
});

//update order
app.patch('/orders/:orderId', authenticate, (req, res) => {
    const { customerName } = req.body;
    const order = orders.find(o => o.id === req.params.orderId && o.token === req.userToken);

    if (!order) return res.status(404).json({ error: "No order with id " + req.params.orderId });
    if (!customerName) return res.status(400).json({ error: "CustomerName is required" });

    order.customerName = customerName;
    res.sendStatus(204);
});

//delete order
app.delete('/orders/:orderId', authenticate, (req, res) => {
    const index = orders.findIndex(o => o.id === req.params.orderId && o.token === req.userToken);
    if (index === -1) {
        return res.status(404).json({ error: "No order with id " + req.params.orderId });
    }

    orders.splice(index, 1);
    res.sendStatus(204);
});


const PORT = 3000;
app.listen(PORT, () => console.log(`backend running on http://localhost:${PORT}`));