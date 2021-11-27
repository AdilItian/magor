const {validationResult} = require('../middleware/utils');
const {check} = require('express-validator');

/**
 * Validates create new item request
 */
exports.createItem = [
	check('name')
		.exists()
		.withMessage('MISSING')
		.not()
		.isEmpty()
		.withMessage('IS_EMPTY'),
	check('email')
		.exists()
		.withMessage('MISSING')
		.not()
		.isEmpty()
		.withMessage('IS_EMPTY')
		.isEmail()
		.withMessage('EMAIL_IS_NOT_VALID'),
	check('password')
		.exists()
		.withMessage('MISSING')
		.not()
		.isEmpty()
		.withMessage('IS_EMPTY'),
	check('role')
		.exists()
		.withMessage('MISSING')
		.not()
		.isEmpty()
		.withMessage('IS_EMPTY')
		.isIn(['user', 'uploader', 'admin'])
		.withMessage('USER_NOT_IN_KNOWN_ROLE'),
	(req, res, next) => {
		validationResult(req, res, next);
	},
];

/**
 * Validates update item request
 */
exports.updateItem = [
	check('name')
		.exists()
		.withMessage('MISSING')
		.not()
		.isEmpty()
		.withMessage('IS_EMPTY'),
	check('email')
		.exists()
		.withMessage('MISSING')
		.not()
		.isEmpty()
		.withMessage('IS_EMPTY'),
	check('role')
		.exists()
		.withMessage('MISSING')
		.not()
		.isEmpty()
		.withMessage('IS_EMPTY')
		.isIn(['user', 'uploader', 'admin'])
		.withMessage('USER_NOT_IN_KNOWN_ROLE'),
	check('userStatus')
		.exists()
		.withMessage('MISSING')
		.isIn(['notVerified', 'verified', 'disabled'])
		.withMessage('INVALID_VALUE'),
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
		.not()
		.isEmpty()
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
		.not()
		.isEmpty()
		.withMessage('IS_EMPTY'),
	(req, res, next) => {
		validationResult(req, res, next);
	},
];
