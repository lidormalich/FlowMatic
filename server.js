const express = require('express');
const path = require('path');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const passport = require('passport');
const cors = require('cors');
const rateLimit = require('express-rate-limit');
const users = require('./routes/api/users');
const appointmentTypes = require('./routes/api/appointmentTypes');
const appointments = require('./routes/api/appointments');
const auth = require('./routes/api/auth');
const clients = require('./routes/api/clients');
const reports = require('./routes/api/reports');
const staff = require('./routes/api/staff');
const templates = require('./routes/api/templates');
const waitlist = require('./routes/api/waitlist');
const inventory = require('./routes/api/inventory');
require('dotenv').config();

require('./config/passport')(passport);

const app = express();

// Trust proxy - required for rate limiting behind proxies
app.set('trust proxy', 1);

// CORS Configuration
app.use(cors({
  origin: process.env.NODE_ENV === 'production'
    ? process.env.FRONTEND_URL
    : 'http://localhost:3000',
  credentials: true
}));

// Rate Limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false
});
app.use('/api/', limiter);

app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

// app.listen(9000);

// const db = require('./config/keys').mongoURI;
const db = require('./config/keys').mongoURI;
mongoose
  .connect(db)
  .then(() => {
    console.log('MongoDB successfully connected.');

    // Start SMS reminder cron job
    const startSMSReminderJob = require('./jobs/smsReminders');
    startSMSReminderJob();
  })
  .catch(err => console.log(err));

app.use(passport.initialize());

app.use('/api/users', users);
app.use('/api/appointment-types', appointmentTypes);
app.use('/api/appointments', appointments);
app.use('/api/auth', auth);
app.use('/api/clients', clients);
app.use('/api/reports', reports);
app.use('/api/staff', staff);
app.use('/api/templates', templates);
app.use('/api/waitlist', waitlist);
app.use('/api/inventory', inventory);

app.use(express.static(path.join(__dirname, 'client-new/build')));

app.get('*', function (req, res) {
  res.sendFile(path.join(__dirname, 'client-new/build', 'index.html'));
});

const port = process.env.PORT || 5000;

app.listen(port, () => console.log(`Server up and running on port ${port} !`));
