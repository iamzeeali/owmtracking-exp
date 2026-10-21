const express = require('express');
const mongoose = require('mongoose');
const morgan = require('morgan');
const AppError = require('./utils/appError');
const globalErrorHandler = require('./controllers/errorController');
const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const mongoSanitize = require('express-mongo-sanitize');
const xss = require('xss-clean');
const compression = require('compression');
var cors = require('cors');
const dotenv = require('dotenv');

// ROuter
const userRouter = require('./routes/userRoutes');
const asnRouter = require('./routes/asnRoutes');
const grnRouter = require('./routes/grnRoutes');
const feedbackRouter = require('./routes/feedbackRoutes');
const trackingRouter = require('./routes/trackingRoutes');
const reportRouter = require('./routes/reportRoutes');

var path = require('path');

const app = express();

//const DB = process.env.DATABASE;
const DB = 'mongodb://zeeshan:globus2015@localhost:27017/owmInventory?authSource=admin&readPreference=primary&ssl=false'

mongoose
  .connect(DB, {
    useNewUrlParser: true,
    useCreateIndex: true,
    useFindAndModify: false,
    useUnifiedTopology: true,
  })
  .then(() => console.log('MongoDB Connected'));

// *********************GLOBAL MIDDLEWARES*******************************

app.use(cors());
//set security http headers
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        // Leaflet loads the map tiles from OpenStreetMap's a/b/c subdomains.
        // Keep all other image sources restricted to the application and data URLs.
        imgSrc: ["'self'", "data:", "https://*.tile.openstreetmap.org"],
      },
    },
  })
);

//development logging
if (
  process.env.NODE_ENV === 'development' ||
  process.env.NODE_ENV === 'production'
) {
  app.use(morgan('dev'));
}

//Limit request from same IP
const limiter = rateLimit({
  max: 500,
  windowMs: 60 * 60 * 1000,
  message: 'Too many requests from this IP, please try again in an hour!',
});
app.use('/api', limiter);

//body parser, reading data into req.body
app.use(express.json({ limit: '10kb' }));

//Data sanitization against Nosql query injections
app.use(mongoSanitize());

//Data sanitization against XSS(cross site scripting attacks)
app.use(xss());

app.use(compression());

//***************************/ROUTES***********************************

app.use('/api/user', userRouter);
app.use('/api/asn', asnRouter);
app.use('/api/grn', grnRouter);
app.use('/api/feedback', feedbackRouter);
app.use('/api/tracking', trackingRouter);
app.use('/api/reports', reportRouter);

// Set headers to ensure correct MIME type for JS and CSS files
app.use((req, res, next) => {
  const filePath = req.path.toLowerCase();
  if (filePath.endsWith('.js')) {
    res.setHeader('Content-Type', 'application/javascript');
  } else if (filePath.endsWith('.css')) {
    res.setHeader('Content-Type', 'text/css');
  }
  next();
});

// Serve static assets in production
// Set static folder
if (process.env.NODE_ENV === 'production') {
  const root = require('path').join(__dirname, 'client', 'build');
  app.use(express.static(root));
  app.get('*', (req, res) => {
    res.sendFile('index.html', { root });
  });
}

app.all('*', (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
