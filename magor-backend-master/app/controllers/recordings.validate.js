const {
	validationResult,
	isTranscriptsArray,
	isTagsArray,
} = require('../middleware/utils');
const { check } = require('express-validator');

/**
 * Validates create new item request
 */
exports.createItem = [
	check('title')
		.exists()
		.withMessage('MISSING')
		.notEmpty()
		.withMessage('IS_EMPTY'),
	check('description')
		.exists()
		.withMessage('MISSING'),
	check('path')
		.exists()
		.withMessage('MISSING')
		.notEmpty()
		.withMessage('IS_EMPTY'),
	check('url')
		.exists()
		.withMessage('MISSING')
		.notEmpty()
		.withMessage('IS_EMPTY'),
	check('audioTrack').exists(),
	check('audioType').exists(),
	check('transcripts')
		.exists()
		.withMessage('MISSING')
		.bail()
		.isArray()
		.withMessage('INVALID_TRANSCRIPTS_FORMAT')
		.if(isTranscriptsArray)
		.withMessage('INVALID_TRANSCRIPTS_FORMAT'),
	check('imageCaptions')
		.exists()
		.withMessage('MISSING')
		.bail()
		.isArray()
		.withMessage('INVALID_TRANSCRIPTS_FORMAT')
		.if(isTranscriptsArray)
		.withMessage('INVALID_TRANSCRIPTS_FORMAT'),
	check('soundCaptions')
		.exists()
		.withMessage('MISSING')
		.bail()
		.isArray()
		.withMessage('INVALID_TRANSCRIPTS_FORMAT')
		.if(isTranscriptsArray)
		.withMessage('INVALID_TRANSCRIPTS_FORMAT'),
	check('tags')
		.exists()
		.withMessage('MISSING')
		.bail()
		.isArray()
		.withMessage('INVALID_TAGS_FORMAT')
		.if(isTagsArray)
		.withMessage('INVALID_TAGS_FORMAT'),
	(req, res, next) => {
		validationResult(req, res, next);
	},
];

/**
 * Validates update item request
 */
exports.updateItem = [
	check('title')
		.exists()
		.withMessage('MISSING')
		.notEmpty()
		.withMessage('IS_EMPTY'),
	check('description')
		.exists()
		.withMessage('MISSING'),
	check('path')
		.exists()
		.withMessage('MISSING')
		.notEmpty()
		.withMessage('IS_EMPTY'),
	check('transcripts')
		.exists()
		.withMessage('MISSING')
		.bail()
		.isArray()
		.withMessage('INVALID_TRANSCRIPTS_FORMAT')
		.if(isTranscriptsArray)
		.withMessage('INVALID_TRANSCRIPTS_FORMAT'),
	check('imageCaptions')
		.exists()
		.withMessage('MISSING')
		.bail()
		.isArray()
		.withMessage('INVALID_TRANSCRIPTS_FORMAT')
		.if(isTranscriptsArray)
		.withMessage('INVALID_TRANSCRIPTS_FORMAT'),
	check('soundCaptions')
		.exists()
		.withMessage('MISSING')
		.bail()
		.isArray()
		.withMessage('INVALID_TRANSCRIPTS_FORMAT')
		.if(isTranscriptsArray)
		.withMessage('INVALID_TRANSCRIPTS_FORMAT'),
	check('tags')
		.exists()
		.withMessage('MISSING')
		.bail()
		.isArray()
		.withMessage('INVALID_TAGS_FORMAT')
		.if(isTagsArray)
		.withMessage('INVALID_TAGS_FORMAT'),
	(req, res, next) => {
		validationResult(req, res, next);
	},
];

/**
 * Validates get item request
 */
exports.getItem = [
	check('id')
		.exists()
		.withMessage('MISSING')
		.notEmpty()
		.withMessage('IS_EMPTY'),
	(req, res, next) => {
		validationResult(req, res, next);
	},
];

/**
 * Validates regenerateEmbeddings item request
 */
exports.regenerateEmbeddings = [
	check('id')
		.exists()
		.withMessage('MISSING')
		.notEmpty()
		.withMessage('IS_EMPTY'),
	(req, res, next) => {
		validationResult(req, res, next);
	},
];

/**
 * Validates delete item request
 */
exports.deleteItem = [
	check('id')
		.exists()
		.withMessage('MISSING')
		.notEmpty()
		.withMessage('IS_EMPTY'),
	(req, res, next) => {
		validationResult(req, res, next);
	},
];
