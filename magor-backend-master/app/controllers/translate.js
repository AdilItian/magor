const utils = require('../middleware/utils');
const {Translate} = require('@google-cloud/translate').v2;
const translate = new Translate({projectId: 'adroit-citadel-270909'});

/********************
 * Public functions *
 ********************/

/**
 * translate function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.translate = async (req, res) => {
	try {
		const {q, tl} = req.query;
		const [translation] = await translate.translate(q, tl);
		res.status(200).json({translation});
	} catch (error) {
		utils.handleError(res, error);
	}
};
