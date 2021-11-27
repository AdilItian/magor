const controller = require('../controllers/translate');
const express = require('express');
const router = express.Router();
require('../../config/passport');
const passport = require('passport');
const requireAuth = passport.authenticate('jwt', {
	session: false,
});
const trimRequest = require('trim-request');

/*
 * Translation route
 */
router.get('/', requireAuth, trimRequest.all, controller.translate);

module.exports = router;
