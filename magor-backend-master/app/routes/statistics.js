const controller = require('../controllers/statistics');
const AuthController = require('../controllers/auth');
const express = require('express');
const router = express.Router();
require('../../config/passport');
const passport = require('passport');
const requireAuth = passport.authenticate('jwt', {
	session: false,
});
const trimRequest = require('trim-request');

/*
 * Statistics routes
 */

/*
 * Get items route
 */
router.get(
	'/',
	requireAuth,
	AuthController.roleAuthorization(['admin']),
	trimRequest.all,
	controller.getStats,
);

module.exports = router;
