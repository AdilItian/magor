const jwt = require('jsonwebtoken');
const User = require('../models/user');
const UserAccess = require('../models/userAccess');
const ForgotPassword = require('../models/forgotPassword');
const utils = require('../middleware/utils');
const uuid = require('uuid');
const {addHours} = require('date-fns');
const {matchedData} = require('express-validator');
const auth = require('../middleware/auth');
const emailer = require('../middleware/emailer');
const fs = require('fs');
const HOURS_TO_BLOCK = 2;
const LOGIN_ATTEMPTS = 5;
const axios = require('axios');

const hostname = 'https://gateway.speechlab.sg';
const registerPath = '/auth/register';
const loginPath = '/auth/login';

// eslint-disable-next-line
const publicKeyFilePath = `${__basedir}/gateway-key.pub`;
const publicKey =
	process.env.NODE_ENV !== 'test'
		? fs.readFileSync(publicKeyFilePath).toString()
		: '';

/*********************
 * Private functions *
 *********************/

/**
 * Generates a token
 * @param {Object} user - user object
 */
const generateToken = user => {
	// Gets expiration time
	const expiration =
		Math.floor(Date.now() / 1000) + 60 * process.env.JWT_EXPIRATION_IN_MINUTES;

	// returns signed and encrypted token
	return auth.encrypt(
		jwt.sign(
			{
				data: {
					_id: user,
				},
				exp: expiration,
			},
			process.env.JWT_SECRET,
		),
	);
};

/**
 * Creates an object with user info
 * @param {Object} req - request object
 */
const setUserInfo = req => {
	let user = {
		_id: req._id,
		name: req.name,
		email: req.email,
		role: req.role,
		verified: req.verified,
	};
	// Adds verification for testing purposes
	if (process.env.NODE_ENV !== 'production') {
		user = {
			...user,
			verification: req.verification,
		};
	}
	return user;
};

/**
 * Saves a new user access and then returns token
 * @param {Object} req - request object
 * @param {Object} user - user object
 */
const saveUserAccessAndReturnToken = async (req, user, accessToken) => {
	return new Promise((resolve, reject) => {
		const userAccess = new UserAccess({
			email: user.email,
			ip: utils.getIP(req),
			browser: utils.getBrowserInfo(req),
			country: utils.getCountry(req),
		});
		userAccess.save(err => {
			if (err) {
				reject(utils.buildErrObject(422, err.message));
			}
			const userInfo = setUserInfo(user);
			// Returns data with access token
			resolve({
				// token: generateToken(user._id),
				token: accessToken,
				user: userInfo,
			});
		});
	});
};

/**
 * Blocks a user by setting blockExpires to the specified date based on constant HOURS_TO_BLOCK
 * @param {Object} user - user object
 */
const blockUser = async user => {
	return new Promise((resolve, reject) => {
		user.blockExpires = addHours(new Date(), HOURS_TO_BLOCK);
		user.save((err, result) => {
			if (err) {
				reject(utils.buildErrObject(422, err.message));
			}
			if (result) {
				resolve(utils.buildErrObject(409, 'BLOCKED_USER'));
			}
		});
	});
};

/**
 * Saves login attempts to dabatabse
 * @param {Object} user - user object
 */
const saveLoginAttemptsToDB = async user => {
	return new Promise((resolve, reject) => {
		user.save((err, result) => {
			if (err) {
				reject(utils.buildErrObject(422, err.message));
			}
			if (result) {
				resolve(true);
			}
		});
	});
};

/**
 * Checks that login attempts are greater than specified in constant and also that blockexpires is less than now
 * @param {Object} user - user object
 */
const blockIsExpired = user =>
	user.loginAttempts > LOGIN_ATTEMPTS && user.blockExpires <= new Date();

/**
 *
 * @param {Object} user - user object.
 */
const checkLoginAttemptsAndBlockExpires = async user => {
	return new Promise((resolve, reject) => {
		// Let user try to login again after blockexpires, resets user loginAttempts
		if (blockIsExpired(user)) {
			user.loginAttempts = 0;
			user.save((err, result) => {
				if (err) {
					reject(utils.buildErrObject(422, err.message));
				}
				if (result) {
					resolve(true);
				}
			});
		} else {
			// User is not blocked, check password (normal behaviour)
			resolve(true);
		}
	});
};

/**
 * Checks if blockExpires from user is greater than now
 * @param {Object} user - user object
 */
const userIsBlocked = async user => {
	return new Promise((resolve, reject) => {
		if (user.blockExpires > new Date()) {
			reject(utils.buildErrObject(409, 'BLOCKED_USER'));
		}
		resolve(true);
	});
};

/**
 * Finds user by email
 * @param {string} email - user´s email
 */
const findUser = async email => {
	return new Promise((resolve, reject) => {
		User.findOne(
			{
				email,
			},
			'password loginAttempts blockExpires name email role verified verification',
			(err, item) => {
				utils.itemNotFound(err, item, reject, 'USER_DOES_NOT_EXIST');
				resolve(item);
			},
		);
	});
};

/**
 * Finds user by ID
 * @param {string} id - user´s id
 */
const findUserById = async userId => {
	return new Promise((resolve, reject) => {
		User.findById(userId, (err, item) => {
			utils.itemNotFound(err, item, reject, 'USER_DOES_NOT_EXIST');
			resolve(item);
		});
	});
};

/**
 * Adds one attempt to loginAttempts, then compares loginAttempts with the constant LOGIN_ATTEMPTS, if is less returns wrong password, else returns blockUser function
 * @param {Object} user - user object
 */
const passwordsDoNotMatch = async user => {
	user.loginAttempts += 1;
	await saveLoginAttemptsToDB(user);
	return new Promise((resolve, reject) => {
		if (user.loginAttempts <= LOGIN_ATTEMPTS) {
			resolve(utils.buildErrObject(409, 'WRONG_PASSWORD'));
		} else {
			resolve(blockUser(user));
		}
		reject(utils.buildErrObject(422, 'ERROR'));
	});
};

/**
 * Registers a new user in database
 * @param {Object} req - request object
 */
const registerUser = async req => {
	return new Promise((resolve, reject) => {
		const user = new User({
			_id: req.gatewayUserID,
			name: req.name,
			email: req.email,
			password: req.password,
			verification: uuid.v4(),
		});
		user.save((err, item) => {
			if (err) {
				reject(utils.buildErrObject(422, err.message));
			}
			resolve(item);
		});
	});
};

/**
 * Builds the registration token
 * @param {Object} item - user object that contains created id
 * @param {Object} userInfo - user object
 */
const returnRegisterToken = (item, userInfo) => {
	if (process.env.NODE_ENV !== 'production') {
		userInfo.verification = item.verification;
	}
	const data = {
		token: generateToken(item._id),
		user: userInfo,
	};
	return data;
};

/**
 * Checks if verification id exists for user
 * @param {string} id - verification id
 */
const verificationExists = async id => {
	return new Promise((resolve, reject) => {
		User.findOne(
			{
				verification: id,
				verified: false,
			},
			(err, user) => {
				utils.itemNotFound(err, user, reject, 'NOT_FOUND_OR_ALREADY_VERIFIED');
				resolve(user);
			},
		);
	});
};

/**
 * Verifies an user
 * @param {Object} user - user object
 */
const verifyUser = async user => {
	return new Promise((resolve, reject) => {
		if (user.userStatus === 'notVerified') {
			user.userStatus = 'verified';
		}
		user.save((err, item) => {
			if (err) {
				reject(utils.buildErrObject(422, err.message));
			}
			resolve({
				email: item.email,
				userStatus: item.userStatus,
			});
		});
	});
};

/**
 * Marks a request to reset password as used
 * @param {Object} req - request object
 * @param {Object} forgot - forgot object
 */
const markResetPasswordAsUsed = async (req, forgot) => {
	return new Promise((resolve, reject) => {
		forgot.used = true;
		forgot.ipChanged = utils.getIP(req);
		forgot.browserChanged = utils.getBrowserInfo(req);
		forgot.countryChanged = utils.getCountry(req);
		forgot.save((err, item) => {
			utils.itemNotFound(err, item, reject, 'NOT_FOUND');
			resolve(utils.buildSuccObject('PASSWORD_CHANGED'));
		});
	});
};

/**
 * Updates a user password in database
 * @param {string} password - new password
 * @param {Object} user - user object
 */
const updatePassword = async (password, user) => {
	return new Promise((resolve, reject) => {
		user.password = password;
		user.save((err, item) => {
			utils.itemNotFound(err, item, reject, 'NOT_FOUND');
			resolve(item);
		});
	});
};

/**
 * Finds user by email to reset password
 * @param {string} email - user email
 */
const findUserToResetPassword = async email => {
	return new Promise((resolve, reject) => {
		User.findOne(
			{
				email,
			},
			(err, user) => {
				utils.itemNotFound(err, user, reject, 'NOT_FOUND');
				resolve(user);
			},
		);
	});
};

/**
 * Checks if a forgot password verification exists
 * @param {string} id - verification id
 */
const findForgotPassword = async id => {
	return new Promise((resolve, reject) => {
		ForgotPassword.findOne(
			{
				verification: id,
				used: false,
			},
			(err, item) => {
				utils.itemNotFound(err, item, reject, 'NOT_FOUND_OR_ALREADY_USED');
				resolve(item);
			},
		);
	});
};

/**
 * Creates a new password forgot
 * @param {Object} req - request object
 */
const saveForgotPassword = async req => {
	return new Promise((resolve, reject) => {
		const forgot = new ForgotPassword({
			email: req.body.email,
			verification: uuid.v4(),
			ipRequest: utils.getIP(req),
			browserRequest: utils.getBrowserInfo(req),
			countryRequest: utils.getCountry(req),
		});
		forgot.save((err, item) => {
			if (err) {
				reject(utils.buildErrObject(422, err.message));
			}
			resolve(item);
		});
	});
};

/**
 * Builds an object with created forgot password object, if env is development or testing exposes the verification
 * @param {Object} item - created forgot password object
 */
const forgotPasswordResponse = item => {
	let data = {
		msg: 'RESET_EMAIL_SENT',
		email: item.email,
	};
	if (process.env.NODE_ENV !== 'production') {
		data = {
			...data,
			verification: item.verification,
		};
	}
	return data;
};

/**
 * Checks against user if has quested role
 * @param {Object} data - data object
 * @param {*} next - next callback
 */
const checkPermissions = async (data, next) => {
	return new Promise((resolve, reject) => {
		User.findById(data.id, (err, result) => {
			utils.itemNotFound(err, result, reject, 'NOT_FOUND');
			if (data.roles.indexOf(result.role) > -1) {
				return resolve(next());
			}
			return reject(utils.buildErrObject(401, 'UNAUTHORIZED'));
		});
	});
};

/**
 * Gets user id from token
 * @param {string} token - Encrypted and encoded token
 */
const getUserIdFromToken = async token => {
	return new Promise((resolve, reject) => {
		// mocking verification
		if (token.startsWith('test_')) {
			resolve(token.split('_')[1]);
			return;
		}
		// Decrypts, verifies and decode token
		jwt.verify(
			token,
			publicKey,
			{
				ignoreExpiration: false,
				ignoreNotBefore: false,
				algorithms: ['RS256'],
				issuer: 'https://gateway.speechlab.sg',
				audience: process.env.GATEWAY_APP_ID,
			},
			(err, decoded) => {
				if (err) {
					reject(utils.buildErrObject(409, 'BAD_TOKEN'));
				}
				/*
			{
				email: 'a@b7.com',
				role: 'user',
				name: 'Aayush Joglekar',
				type: 'normal',
				iat: 1611913427,
				nbf: 1611913427,
				exp: 1614505427,
				aud: '6013d417a15d2300300cd559',
				iss: 'https://gateway.speechlab.sg',
				sub: '6013c9eaa15d2300300cd469'
			}
			*/
				resolve(decoded.sub);
			},
		);
	});
};

/********************
 * Public functions *
 ********************/

/**
 * Login function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.login = async (req, res) => {
	try {
		// extract necessary data from request body
		const data = matchedData(req);
		// fetch user account
		const user = await findUser(data.email);
		// validate account
		await userIsBlocked(user);
		await checkLoginAttemptsAndBlockExpires(user);
		// generating request configuration
		const path = `${hostname}${loginPath}`;
		const payload = {
			email: data.email,
			password: data.password,
			appId: process.env.GATEWAY_APP_ID,
			appSecret: process.env.GATEWAY_APP_SECRET,
		};
		axios
			.post(path, payload)
			.then(async ({data: resData}) => {
				const accessToken = resData.accessToken;
				// reset user login attempts on successful login
				user.loginAttempts = 0;
				await saveLoginAttemptsToDB(user);
				const successPayload = await saveUserAccessAndReturnToken(
					req,
					user,
					accessToken,
				);
				// TODO use utils.handleResponse
				res.status(200).json(successPayload);
			})
			.catch(async ({response}) => {
				if (response.status === 401) {
					utils.handleResponse(
						res,
						response.status,
						'incorrect password',
						true,
					);
				} else if (response.status === 404) {
					utils.handleResponse(res, response.status, 'user not found', true);
				} else {
					utils.handleResponse(res, response.status, response.data, true);
				}
			});
	} catch (error) {
		if (error.code === 404) {
			utils.handleResponse(res, 404, 'user not found', true);
		} else {
			// TODO use utils.handleResponse
			utils.handleError(res, error);
		}
	}
};

/**
 * Register function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.register = async (req, res) => {
	try {
		// Gets locale from header 'Accept-Language'
		const locale = req.getLocale();
		req = matchedData(req);
		const doesEmailExists = await emailer.emailExists(req.email);
		if (!doesEmailExists) {
			// generate request configuration
			const path = `${hostname}${registerPath}`;
			const payload = {
				name: req.name,
				email: req.email,
				password: req.password,
				appId: process.env.GATEWAY_APP_ID,
				appSecret: process.env.GATEWAY_APP_SECRET,
			};
			// register user on the gateway
			const data = await axios.post(path, payload);
			// use the id recieved from gateway as user's primary ID
			req.gatewayUserID = data.data._id;
			// register user to database
			const item = await registerUser(req);
			// add verification code to user object when in developer mode
			const userInfo = setUserInfo(item);
			// const response = returnRegisterToken(item, userInfo);
			emailer.sendRegistrationEmailMessage(locale, item);
			const successPayload = {token: 'unavailable', user: userInfo};
			res.status(201).json(successPayload);
		}
	} catch (error) {
		// TODO Improve error handling
		utils.handleResponse(res, 422, error, true);
	}
};

/**
 * Get Current User
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getUserData = async (req, res) => {
	try {
		const tokenEncrypted = req.headers.authorization
			.replace('Bearer ', '')
			.trim();
		// Decrypts the token and extracts UserID
		let userId = await getUserIdFromToken(tokenEncrypted);
		// Validates user ID as proper MongoDB ObjectID
		userId = await utils.isIDGood(userId);
		// Retrieve user from database
		const user = await findUserById(userId);
		const payload = {
			role: user.role,
			name: user.name,
			email: user.email,
		};
		res.status(200).json(payload);
	} catch (error) {
		res.status(404).json({error: 'Not Found'});
		// utils.handleError(res, error);
	}
};

exports.authenticate = async (req, res) => {
	try {
		const tokenEncrypted = req.headers.authorization
			.replace('Bearer ', '')
			.trim();
		// Decrypts the token and extracts UserID
		let userId = await getUserIdFromToken(tokenEncrypted);
		// Validates user ID as proper MongoDB ObjectID
		userId = await utils.isIDGood(userId);
		// Retrieve user from database
		const user = await findUserById(userId);
		res.status(200).json(user);
	} catch (error) {
		console.log(error);
		res.status(404).json({error: 'Not Found'});
		// utils.handleError(res, error);
	}
};

/**
 * Refresh token function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getRefreshToken = async (req, res) => {
	try {
		const tokenEncrypted = req.headers.authorization
			.replace('Bearer ', '')
			.trim();
		let userId = await getUserIdFromToken(tokenEncrypted);
		userId = await utils.isIDGood(userId);
		const user = await findUserById(userId);
		const token = await saveUserAccessAndReturnToken(req, user, tokenEncrypted);
		// Removes user info from response
		delete token.user;
		res.status(200).json(token);
	} catch (error) {
		utils.handleError(res, error);
	}
};

/**
 * Verify function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.verify = async (req, res) => {
	try {
		req = matchedData(req);
		const user = await verificationExists(req.id);
		res.status(200).json(await verifyUser(user));
	} catch (error) {
		utils.handleError(res, error);
	}
};

/**
 * Forgot password function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.forgotPassword = async (req, res) => {
	try {
		// Gets locale from header 'Accept-Language'
		const locale = req.getLocale();
		const data = matchedData(req);
		await findUser(data.email);
		const item = await saveForgotPassword(req);
		emailer.sendResetPasswordEmailMessage(locale, item);
		res.status(200).json(forgotPasswordResponse(item));
	} catch (error) {
		utils.handleError(res, error);
	}
};

/**
 * Reset password function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.resetPassword = async (req, res) => {
	try {
		const data = matchedData(req);
		const forgotPassword = await findForgotPassword(data.id);
		const user = await findUserToResetPassword(forgotPassword.email);
		await updatePassword(data.password, user);
		const result = await markResetPasswordAsUsed(req, forgotPassword);
		res.status(200).json(result);
	} catch (error) {
		utils.handleError(res, error);
	}
};

/**
 * Roles authorization function called by route
 * @param {Array} roles - roles specified on the route
 */
exports.roleAuthorization = roles => async (req, res, next) => {
	try {
		const data = {
			id: req.user._id,
			roles,
		};
		await checkPermissions(data, next);
	} catch (error) {
		utils.handleError(res, error);
	}
};
