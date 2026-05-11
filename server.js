const express = require('express');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const path = require('path');
const fs = require('fs');
const mongoose = require('mongoose');
const morgan = require('morgan');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(morgan('dev'));
app.use(express.json());
app.use('/invoice', express.static(path.join(__dirname, 'invoice'), {
  setHeaders: (res, path) => {
    if (path.endsWith('.pdf')) {
      res.setHeader('Content-Disposition', 'attachment');
    }
  }
}));

// Mock Data
const users = [
  { id: 1, name: 'Akbar Hussain', username: 'akbar@halalfood2021.onmicrosoft.com', licenses: 'Unlicensed' },
  { id: 2, name: 'Ali Niaz', username: 'ali@halalfood2021.onmicrosoft.com', licenses: 'Unlicensed' },
  { id: 3, name: 'Amir Masoom', username: 'amir@halalfood2021.onmicrosoft.com', licenses: 'Unlicensed' },
  { id: 4, name: 'Caner Guzelgonul', username: 'Caner@halalfood2021.onmicrosoft.com', licenses: 'Unlicensed' },
  { id: 5, name: 'Enas Alqatarneh (HFA)', username: 'enas@halalfood2021.onmicrosoft.com', licenses: 'Unlicensed' },
  { id: 6, name: 'Haidir H', username: 'haidir@halalfood2021.onmicrosoft.com', licenses: 'Unlicensed' },
  { id: 7, name: 'Hameed Yakubu', username: 'Hameed@halalfood2021.onmicrosoft.com', licenses: 'Unlicensed' },
  { id: 8, name: 'Hifza Ibrahim', username: 'hifza@halalfood2021.onmicrosoft.com', licenses: 'Unlicensed' },
  { id: 9, name: 'Imtiaz Hussain', username: 'imtiaz@halalfood2021.onmicrosoft.com', licenses: 'Unlicensed' },
  { id: 10, name: 'Jaweria Asad', username: 'jaweria@halalfood2021.onmicrosoft.com', licenses: 'Unlicensed' },
  { id: 11, name: 'Khadija Xie', username: 'Khadija@halalfood2021.onmicrosoft.com', licenses: 'Unlicensed' },
  { id: 12, name: 'Mufty AbdulWahab', username: 'wahab@halalfood2021.onmicrosoft.com', licenses: 'Unlicensed' },
  { id: 13, name: 'Muhammed Amir', username: 'muhammed@halalfood2021.onmicrosoft.com', licenses: 'Unlicensed' },
  { id: 14, name: 'Rashid Abasi', username: 'rashid@halalfood2021.onmicrosoft.com', licenses: 'Unlicensed' },
  { id: 15, name: 'Riaz Patel', username: 'riaz@halalfood2021.onmicrosoft.com', licenses: 'Unlicensed' },
  { id: 16, name: 'Sadia Anjum', username: 'sadia@halalfood2021.onmicrosoft.com', licenses: 'Unlicensed' },
  { id: 17, name: 'Shabeeb Ali', username: 'shabeeb@halalfood2021.onmicrosoft.com', licenses: 'Unlicensed' },
  { id: 18, name: 'Shahriar Ahmed Sizan', username: 'shahriar@halalfood2021.onmicrosoft.com', licenses: 'Unlicensed' },
  { id: 19, name: 'Shehab Udeen', username: 'shehab@halalfood2021.onmicrosoft.com', licenses: 'Unlicensed' },
  { id: 20, name: 'Shirin Aghaei', username: 'shirin@halalfood2021.onmicrosoft.com', licenses: 'Unlicensed' },
  { id: 21, name: 'Taoheed Ogundapo', username: 'ict@halalfood2021.onmicrosoft.com', licenses: 'Unlicensed' },
  { id: 22, name: 'Taoheed Olalekan', username: 'lekan@halalfood2021.onmicrosoft.com', licenses: 'Unlicensed', hasKey: true },
  { id: 23, name: 'Umme Uroos', username: 'uroos@halalfood2021.onmicrosoft.com', licenses: 'Unlicensed' },
];

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('Successfully connected to MongoDB Atlas'))
  .catch(err => console.error('MongoDB connection error:', err));

// Ticket Schema
const ticketSchema = new mongoose.Schema({
  title: String,
  description: String,
  severity: { type: String, default: 'Normal' },
  email: String,
  phone: String,
  status: { type: String, default: 'Open' },
  createdAt: { type: Date, default: Date.now },
  replies: [{
    message: String,
    sender: String,
    createdAt: { type: Date, default: Date.now }
  }]
}, {
  toJSON: { virtuals: true },
  toObject: { virtuals: true }
});

const Ticket = mongoose.model('Ticket', ticketSchema);

const billingAccounts = [
  { id: 1, name: 'Halal Food Authority', location: 'London, LONDON GB', status: 'Active', type: 'Microsoft Customer Agreement' },
  { id: 2, name: 'Halal Food Foundation', location: 'London, LONDON GB', status: 'Active', type: 'Microsoft Online Subscription Agreement' }
];

const products = {
  smb: [
    { id: 1, title: 'Microsoft 365 Business Basic', desc: 'Best for businesses that need professional email, cloud file storage, and online meetings & chat. Desktop versions of Office apps like Excel, Word,...', price: 'From £104.60 licenses/month' },
    { id: 2, title: 'Microsoft 365 Business Basic (Month to Month)', desc: 'Best for businesses that need professional email, cloud file storage, and online meetings & chat. Desktop versions of Office apps like Excel, Word,...', price: 'From £105.50 licenses/month' },
    { id: 3, title: 'Microsoft 365 Business Premium', desc: 'Best for businesses that need all the apps and services included in Business Standard plus advanced cyber threat protection and device...', price: 'From £116.90 licenses/month' },
    { id: 4, title: 'Microsoft 365 Business Premium (Month to Month)', desc: 'Best for businesses that need all the apps and services included in Business Standard plus advanced cyber threat protection and device...', price: 'From £120.30 licenses/month' },
  ],
  enterprise: [
    { id: 5, title: 'Office 365 E1 (Month to Month)', desc: 'The online versions of Office with email, instant messaging, HD video conferencing, plus 1 TB personal file storage and sharing. Does not includ...', price: 'From £110.80 licenses/month' },
    { id: 6, title: 'Office 365 E3', desc: 'The Office suite for PC and Mac with apps for tablets and phones, plus email, instant messaging, HD video conferencing, 1 TB personal file storage...', price: 'From £120.60 licenses/month' },
    { id: 7, title: 'Office 365 E3 ', desc: 'The Office suite for PC and Mac with apps for tablets and phones, plus email, instant messaging, MS Teams for Business, HD video conferencing, 1 TB personal file storage for each user. Provides personal cloud storage, offline access and sharing along with convenient online companions to Microsoft Word, Excel, PowerPoint', price: 'From £143.00 licenses/month' },
    { id: 8, title: 'Microsoft Windows 11 Pro', desc: 'Designed for the world of hybrid work, Windows 11 can help you work more simply and seamlessly from anywhere. Buy and download Windows 11 for Professionals, Free Updates, Free software, free Upgrades', price: 'From £74.00 licenses/month' },
  ],
  standalone: [
    { id: 9, title: 'Exchange Online (Plan 1)', desc: 'Messaging, calendaring, and email archiving plan accessible from Outlook on PCs, the Web and mobile devices.', price: 'From £103.10 licenses/month' },
    { id: 10, title: 'OneDrive for business (Plan 2)', desc: 'Provides personal cloud storage, offline access and sharing along with convenient online companions to Microsoft Word, Excel, PowerPoint, and OneNo...', price: 'From £107.70 licenses/month' },
    { id: 11, title: 'Visio Plan 1 (Month to Month)', desc: 'A lightweight web-based diagramming solution that gives users an opportunity to create, share and store basic diagrams anywhere.', price: 'From £104.60 licenses/month' },
    { id: 12, title: 'Visio Plan 2 (Month to Month)', desc: 'Makes it easier than ever for individuals and teams to create data-linked diagrams that simplify complex information. It includes support for BPM...', price: 'From £113.80 licenses/month' },
  ],
  nonprofit: {
    remoteWork: [
      { id: 13, title: 'Microsoft 365 Business Premium (Nonprofit Staff Pricing)', desc: 'Best for businesses that need all the apps and services included in Business Standard plus advanced cyber threat protection and device...', price: 'Free licenses' },
      { id: 14, title: 'Microsoft 365 E3 (Nonprofit Staff Pricing)', desc: 'Office 365 E3, Enterprise Mobility + Security E3, and Windows 10/11 Enterprise E3. This per-user licensed suite of products offers users best-in-cla...', price: 'Free licenses' },
      { id: 15, title: 'Planner and Project Plan 3 (Nonprofit Staff Pricing)', desc: 'Achieve comprehensive project management with our solution that keeps your projects, resources, and teams organized and on track. Plan, track, an...', price: 'Free licenses' },
      { id: 16, title: 'Microsoft 365 E5 (Nonprofit Staff Pricing)', desc: 'Office 365 E5, Enterprise Mobility + Security E5, and Windows 10/11 Enterprise E5. This per-user licensed suite of products offers customers the...', price: 'Free licenses' },
    ],
    analytics: [
      { id: 17, title: 'Microsoft Fabric (Free) (Nonprofit Staff Pricing)', desc: 'A cloud-based business analytics service that enables anyone to visualize and analyze data with greater speed, efficiency, and understanding. It...', price: 'Free licenses' },
      { id: 18, title: 'Power BI Pro (Nonprofit Staff Pricing)', desc: 'A cloud-based business analytics service that enables anyone to visualize and analyze data with greater speed, efficiency, and understanding. Pow...', price: 'Free licenses' },
    ]
  }
};

const invoices = [
  { id: 'EO489YUP4K', date: '03/09/2024', amount: '£3840.00', status: 'Paid', pay: 'Paid', account: 'Halal Food Foundation', billin: 'N/A', pdf: 'invoice 1.pdf' },
  { id: 'EO890DBU6', date: '11/01/2024', amount: '£1728.00', status: 'Paid', pay: 'Paid', account: 'Halal Food Foundation', billin: 'N/A', pdf: 'invoice 2.pdf' },
  { id: 'EO839AFF3U', date: '12/02/2024', amount: '£22857.19', status: 'Paid', pay: 'Paid', account: 'Halal Food Foundation', billin: 'N/A', pdf: 'invoice 3.pdf' },
  { id: 'EO890DBU6', date: '11/01/2024', amount: '£1728.00', status: 'Paid', pay: 'Paid', account: 'Halal Food Foundation', billin: 'N/A', pdf: 'invoice 4.pdf' },
  { id: 'EO785YOP', date: '14/11/2023', amount: '£1400.00', status: 'Paid', pay: 'Paid', account: 'Halal Food Foundation', billin: 'N/A', pdf: 'invoice 5.pdf' },
  { id: 'EO8392PLE9N', date: '03/11/2023', amount: '£3895.70', status: 'Paid', pay: 'Paid', account: 'Halal Food Foundation', billin: 'N/A', pdf: 'invoice 6.pdf' },
  { id: 'EO89ODBU6', date: '05/06/2022', amount: '£1728.00', status: 'Paid', pay: 'Paid', account: 'Halal Food Foundation', billin: 'N/A', pdf: 'invoice 7.pdf' },
  { id: 'EO895HFA4L', date: '27/03/2023', amount: '£2301.12', status: 'Paid', pay: 'Paid', account: 'Halal Food Foundation', billin: 'N/A', pdf: 'invoice 8.pdf' },
  { id: 'EO932HFAP5', date: '21/07/2022', amount: '£3999.00', status: 'Paid', pay: 'Paid', account: 'Halal Food Foundation', billin: 'N/A', pdf: 'invoice 9.pdf' },
  { id: 'EO7051HFA50', date: '24/03/2025', amount: '£8553.06', status: 'Paid', pay: 'Paid', account: 'Halal Food Foundation', billin: 'N/A', pdf: 'invoice 10.pdf' },
  { id: 'EO893HFA9W6+1', date: '03/10/2023', amount: '£217.44', status: 'Paid', pay: 'Paid', account: 'Halal Food Foundation', billin: 'N/A', pdf: 'invoice 11.pdf' },
  { id: 'EO378HFA3R5+1', date: '03/10/2023', amount: '£217.44', status: 'Paid', pay: 'Paid', account: 'Halal Food Foundation', billin: 'N/A', pdf: 'invoice 12.pdf' },
  { id: 'EO378HFA3R5+2', date: '22/02/2022', amount: '£434.88', status: 'Paid', pay: 'Paid', account: 'Halal Food Foundation', billin: 'N/A', pdf: 'invoice 13.pdf' },
];

let globalSettings = {
  accountType: 'Nonprofit'
};

const ADMIN_USER = {
  email: 'ict@halalfood2021.onmicrosoft.com',
  password: 'Muhayad2008' // In a real app, this would be hashed
};

const SUPPORT_ADMIN_USER = {
  email: 'supportadmin@halalfood2021.onmicrosoft.com',
  password: 'SupportPassword2026'
};

const JWT_SECRET = process.env.JWT_SECRET || 'microsoft_admin_secret_key';

// Middleware to verify token
const verifyToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Access denied. Invalid token format.' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (ex) {
    res.status(401).json({ message: 'Invalid or expired token.' });
  }
};

// Routes
app.post('/api/login', async (req, res) => {
  const { email, password } = req.body;

  if (email === ADMIN_USER.email && password === ADMIN_USER.password) {
    const token = jwt.sign({ email: ADMIN_USER.email, role: 'admin' }, JWT_SECRET, { expiresIn: '1h' });
    res.json({
      token,
      user: {
        email: ADMIN_USER.email,
        name: 'Administrator'
      }
    });
  } else if (email === SUPPORT_ADMIN_USER.email && password === SUPPORT_ADMIN_USER.password) {
    const token = jwt.sign({ email: SUPPORT_ADMIN_USER.email, role: 'support' }, JWT_SECRET, { expiresIn: '1h' });
    res.json({
      token,
      user: {
        email: SUPPORT_ADMIN_USER.email,
        name: 'Support Administrator'
      }
    });
  } else {
    res.status(401).json({ message: 'Invalid email or password' });
  }
});

app.get('/api/users', verifyToken, (req, res) => {
  res.json(users);
});

app.get('/api/billing-accounts', verifyToken, (req, res) => {
  res.json(billingAccounts);
});

app.get('/api/products', verifyToken, (req, res) => {
  res.json(products);
});

app.get('/api/invoices', verifyToken, (req, res) => {
  res.json(invoices);
});

app.get('/api/settings', verifyToken, (req, res) => {
  res.json(globalSettings);
});

// Ticket Routes
app.get('/api/tickets', verifyToken, async (req, res) => {
  try {
    const tickets = await Ticket.find();
    res.json(tickets);
  } catch (err) {
    console.error('Fetch tickets error:', err);
    res.status(500).json({ message: 'Error fetching tickets', error: err.message });
  }
});

app.post('/api/tickets', verifyToken, async (req, res) => {
  const { title, description, severity, email, phone } = req.body;
  if (!title || !description || !email) return res.status(400).json({ message: 'Missing required fields' });

  try {
    const newTicket = new Ticket({
      title,
      description,
      severity,
      email,
      phone
    });
    await newTicket.save();
    res.status(201).json(newTicket);
  } catch (err) {
    res.status(500).json({ message: 'Error creating ticket' });
  }
});

app.patch('/api/tickets/:id/reply', verifyToken, async (req, res) => {
  const { id } = req.params;
  const { message } = req.body;

  if (!message) return res.status(400).json({ message: 'Reply message is required' });

  try {
    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    ticket.replies.push({
      message,
      sender: req.user.email === SUPPORT_ADMIN_USER.email ? 'Microsoft Support' : 'Customer'
    });
    
    ticket.status = req.user.email === SUPPORT_ADMIN_USER.email ? 'In Progress' : 'Open';
    await ticket.save();
    res.json(ticket);
  } catch (err) {
    res.status(500).json({ message: 'Error adding reply' });
  }
});

app.delete('/api/tickets/:id', verifyToken, async (req, res) => {
  if (req.user.role !== 'support') return res.status(403).json({ message: 'Access denied. Support only.' });
  
  const { id } = req.params;
  try {
    const ticket = await Ticket.findByIdAndDelete(id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json({ message: 'Ticket deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting ticket' });
  }
});

app.patch('/api/settings', verifyToken, (req, res) => {
  const { accountType } = req.body;
  if (accountType) {
    globalSettings.accountType = accountType;
    res.json({ message: `Account type updated to ${accountType}`, settings: globalSettings });
  } else {
    res.status(400).json({ message: 'Invalid data' });
  }
});

app.get('/', (req, res) => {
  res.send('Microsoft Admin Center Backend API is running...');
});

if (process.env.NODE_ENV !== 'production') {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
}

module.exports = app;
