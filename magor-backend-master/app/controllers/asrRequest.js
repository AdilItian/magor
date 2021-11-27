const model = require('../models/asrRequest');
const Recording = require('../models/recording');
const asr = require('../middleware/genTranscriptViaASR');
const transcriptParser = require('../middleware/transcriptParser');
const db = require('../middleware/db');
const utils = require('../middleware/utils');

const fetchAndUpdateASR = async (asrId, dataLink) => {
	return new Promise(async (resolve, reject) => {
		try {
			const asrRequest = await model.findOne({ asrId });
			const recordingId = asrRequest.recordingId;
			const recording = await Recording.findById(recordingId);
			const srtPath = await asr.retrieveTranscripts(asrId, null, dataLink);
			let transcript;
			for (transcript of recording.transcripts) {
				// eslint-disable-next-line max-depth
				if (transcript.asrId === asrId) {
					transcript.path = srtPath;
					// eslint-disable-next-line max-depth
					if (recording.transcripts.indexOf(transcript) === 0) {
						// repopulate data if default transcript
						const parsedTranscript = await transcriptParser(srtPath);
						recording.uniqueWordsSpeech = parsedTranscript.speechSegments;
						recording.uniqueWordsImage = parsedTranscript.imageSegments;
						recording.uniqueWordsSound = parsedTranscript.soundSegments;
						recording.speakers = parsedTranscript.speakers;
					}
					console.log('Updated transcript', srtPath);
					asrRequest.completed = true;
					await recording.save();
					await asrRequest.save();
					break;
				}
			}
			resolve(true);
		} catch (err) {
			reject(err);
		}
	});
};


const checkAllPendingASRRequests = () => {
	return new Promise(async (resolve, reject) => {
		try {
			const docs = await model.find({ completed: false });
			let doc;
			for (doc of docs) {
				const { status } = await asr.checkStatus(doc.asrId);
				if (status === 'done') {
					await fetchAndUpdateASR(doc.asrId);
				}
			}
			resolve(true);
		} catch (err) {
			console.error(err);
			reject(false);
		}
	});
};

/**
 * Get items function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
const getItems = async (req, res) => {
	try {
		const query = await db.checkQueryString(req.query);
		res.status(200).json(await db.getItems(req, model, query));
	} catch (error) {
		utils.handleError(res, error);
	}
};

module.exports = {getItems, checkAllPendingASRRequests, fetchAndUpdateASR};
