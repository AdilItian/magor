const controller = require('../controllers/auth');
const validate = require('../controllers/auth.validate');
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
 *	POST /login
 */
router.post('/login', trimRequest.all, validate.login, controller.login);

/*
 * POST /register
 */
router.post(
	'/register',
	trimRequest.all,
	validate.register,
	controller.register,
);

/*
 * GET user data
 */
router.get('/', trimRequest.all, controller.getUserData);

/*
 * Get new refresh token
 */
router.get(
	'/token',
	requireAuth,
	AuthController.roleAuthorization(['user', 'uploader', 'admin']),
	trimRequest.all,
	controller.getRefreshToken,
);

/*
 * Verify route
 */
router.post('/verify', trimRequest.all, validate.verify, controller.verify);

/********************
 * TODO Pending Docs *
 ********************/

/*
 * Forgot password route
 */
router.post(
	'/forgot',
	trimRequest.all,
	validate.forgotPassword,
	controller.forgotPassword,
);

/*
 * Reset password route
 */
router.post(
	'/reset',
	trimRequest.all,
	validate.resetPassword,
	controller.resetPassword,
);

router.get('/authenticate', trimRequest.all, controller.authenticate);

module.exports = router;
