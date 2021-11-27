const controller = require('../controllers/recordings');
const validate = require('../controllers/recordings.validate');
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
 * Recordings routes
 */

// FILE UPLOAD

/*
 * Upload Recording Route
 */
router.post(
	'/uploadRecording',
	requireAuth,
	AuthController.roleAuthorization(['admin', 'uploader']),
	controller.uploadRecording,
);

/*
 * Upload Transcript Route
 */
router.post(
	'/uploadTranscript',
	requireAuth,
	AuthController.roleAuthorization(['admin', 'uploader']),
	controller.uploadTranscript,
);

/*
 * Get items route
 */
router.get(
	'/',
	requireAuth,
	AuthController.roleAuthorization(['admin', 'uploader', 'user']),
	trimRequest.all,
	controller.getItems,
);

/*
 * Get items uploaded by user
 */
router.get(
	'/userUploads',
	requireAuth,
	AuthController.roleAuthorization(['admin', 'uploader']),
	trimRequest.all,
	controller.getUserUploads,
);

/*
 * Regenerate Unique Words
 */
router.get(
	'/regenUniqueWords',
	requireAuth,
	AuthController.roleAuthorization(['admin']),
	trimRequest.all,
	controller.regenUniqueWords,
);

/*
 * Create new item route
 */
router.post(
	'/',
	requireAuth,
	AuthController.roleAuthorization(['admin', 'uploader']),
	trimRequest.all,
	validate.createItem,
	controller.createItem,
);

/*
 * Get item route
 */
router.get(
	'/:id',
	requireAuth,
	AuthController.roleAuthorization(['admin', 'uploader', 'user']),
	trimRequest.all,
	validate.getItem,
	controller.getItem,
);

/*
 * Update item route
 */
router.patch(
	'/:id',
	requireAuth,
	AuthController.roleAuthorization(['admin', 'uploader']),
	trimRequest.all,
	validate.updateItem,
	controller.updateItem,
);

/*
 * Regenerate Embeddings
 */

// router.post(
// '/regenerateEmbeddings',
// requireAuth,
// AuthController.roleAuthorization(['admin', 'uploader']),
// trimRequest.all,
// validate.regenerateEmbeddings,
// controller.regenerateEmbeddings,
// );

/*
 * Delete item route
 */
router.delete(
	'/:id',
	requireAuth,
	AuthController.roleAuthorization(['admin', 'uploader']),
	trimRequest.all,
	validate.deleteItem,
	controller.deleteItem,
);

router.get(
	'/checkASR/:recordingId/:asrId',
	requireAuth,
	AuthController.roleAuthorization(['user', 'uploader', 'admin']),
	controller.checkIfASRTranscriptReady,
);

router.post('/status', controller.updateStatus);

module.exports = router;
