require('dotenv-safe').config();
global.__basedir = __dirname;

const express = require('express');
const bodyParser = require('body-parser');
const morgan = require('morgan');
const compression = require('compression');
const helmet = require('helmet');
const cors = require('cors');
const passport = require('passport');
const app = express();
const i18n = require('i18n');
const initMongo = require('./config/mongo');
const { azureStorageClient, initAzure } = require('./config/azure');
const path = require('path');
// const requireAuth = passport.authenticate('jwt', {
// 	session: false,
// });
const { checkAllPendingASRRequests } = require('./app/controllers/asrRequest');
// Set __basedir as root path of project


// Setup express server port from ENV, default: 3000
app.set('port', process.env.PORT || 3000);

// Enable only in development HTTP request logger middleware
if (process.env.NODE_ENV === 'development') {
	app.use(morgan('dev'));
}

// Redis cache enabled by env variable
if (process.env.USE_REDIS === 'true') {
	const getExpeditiousCache = require('express-expeditious');
	const cache = getExpeditiousCache({
		namespace: 'expresscache',
		defaultTtl: '1 minute',
		engine: require('expeditious-engine-redis')({
			host: process.env.REDIS_HOST,
			port: process.env.REDIS_PORT,
		}),
	});
	app.use(cache);
}

// for parsing json
app.use(
	bodyParser.json({
		limit: '20mb',
	}),
);
// for parsing application/x-www-form-urlencoded
app.use(
	bodyParser.urlencoded({
		limit: '20mb',
		extended: true,
	}),
);

// i18n
i18n.configure({
	locales: ['en', 'es'],
	directory: `${__dirname}/locales`,
	defaultLocale: 'en',
	objectNotation: true,
});
app.use(i18n.init);

// Init all other stuff
app.use(cors());
app.use(passport.initialize());
app.use(compression());
app.use(helmet());
// app.use('/static', [requireAuth, express.static('public')]);
app.use('/static', [express.static('public')]);
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'html');
app.use(require('./app/routes'));
app.listen(app.get('port'), '0.0.0.0');

// Init MongoDB
initMongo();

// Initialise Azure Storage
initAzure().then(async () => {
	console.log("*  Successfully initialized Azure Storage Client");
	const containerClient = azureStorageClient.getContainerClient("recordings");
	let i = 1;
	let blobs = containerClient.listBlobsFlat();
	for await (const blob of blobs) {
		console.log(`Blob ${i++}: ${blob.name}`);
	}
}).catch(e => {
	console.error(e);
})

// Retreive all pending ASR Requests
// checkAllPendingASRRequests();

module.exports = app; // for testing
