/* eslint-disable */

const {
	getVideoDurationInSeconds: genVideoDuration,
} = require('get-video-duration');
const mime = require('mime-types');
const ffmpeg = require('fluent-ffmpeg');

const fs = require('fs');
const path = require('path');

const model = require('../models/recording');
const mediaModel = require('../models/media');
const transcriptModel = require('../models/transcript');
const ASRRequest = require('../models/asrRequest');
const {matchedData} = require('express-validator');
const utils = require('../middleware/utils');
const db = require('../middleware/db');
const multer = require('multer');
const transcriptProvider = require('../middleware/transcriptProvider');
const transcriptParser = require('../middleware/transcriptParser');
const captionTypes = require('../middleware/types');
const asr = require('../middleware/genTranscriptViaASR');
const {body} = require('trim-request');
const {fetchAndUpdateASR} = require('./asrRequest');
// const {genEmbeddings} = require('../middleware/transcript');
const {uploadRecordingFromPath} = require('../middleware/storage');

/*********************
 * Private functions *
 *********************/

/*
 * Sanitize Tags and Transcripts
 */
const sanitizeTag = ({tagName, tagId, source, startTimeMs, endTimeMs}) => ({
	tagId,
	tagName,
	source,
	startTimeMs,
	endTimeMs,
});

const sanitizeTranscriptAndAddId = (
	{path: _p, format, version, name, asrLanguage = 'english'},
	uploaderId,
) => ({
	path: _p,
	format,
	version,
	uploaderId,
	name:
		name ||
		`${
			_p === 'ASR_TEMP' ? `ASR ${asrLanguage}`.toUpperCase() : 'UPLOAD'
		} ${new Date().toLocaleDateString('en-sg')}`,
	asrLanguage,
});

const defaultImage = 'public/images/audio.svg';

const genThumbnail = path => {
	return new Promise(resolve => {
		try {
			if (mime.lookup(path).split('/')[0] === 'video') {
				const out = path.match(/([^/.]*)\..*$/)[1];
				const outPath = `public/images/${out}.jpg`;
				ffmpeg(path)
					.outputOptions(['-vframes 1', '-ss 10'])
					.output(outPath)
					.on('error', () => resolve(defaultImage))
					.on('end', () => resolve(outPath))
					.run();
			} else {
				resolve(defaultImage);
			}
		} catch (err) {
			console.error(err);
			resolve(defaultImage);
		}
	});
};

const renameTempFile = (oldPath, dir) => {
	let match;
	if ((match = oldPath.match(/^public\/temp\/(.*)/))) {
		const newPath = `public/${dir}/${match[1]}`;
		try {
			fs.renameSync(oldPath, newPath);
			return newPath;
		} catch (err) {
			console.error(`Couldn't move ${oldPath} to ${dir}`);
			console.error(err);
			throw new Error(`Couldn't move ${oldPath} to ${dir}`);
		}
	} else if ((match = oldPath.match(new RegExp(`^public/${dir}/`, 'i')))) {
		return oldPath;
	}
	throw new Error(`Couldn't move ${oldPath} to ${dir}`);
};

const renameTempTranscripts = (transcripts, dir) => {
	let transcript;
	for (transcript of transcripts) {
		if (transcript.path === 'ASR_TEMP') {
			continue;
		}
		transcript.path = renameTempFile(transcript.path, dir);
	}
};

/*
 * Multer Functions
 */

const getStorageObject = destPath =>
	multer.diskStorage({
		destination: destPath,
		filename: (req, file, cb) => {
			const f = file.originalname.split('.');
			f.splice(0, 1, `${f[0][0]}-${Date.now()}`);
			cb(null, f.join('.'));
		},
	});

const filterFileByMime = types => (req, file, cb) => {
	if (types.indexOf(file.mimetype.split('/')[0]) === -1) {
		return cb(
			`Error - Only ${types.join(',')} files supported. Received ${
				file.mimetype
			}`,
		);
	}
	return cb(null, true);
};

const filterTranscript = (req, file, cb) => {
	if (!file.originalname.match(/\.(srt|vtt|stm|textgrid|xml|json)$/i)) {
		return cb(`Error - Transcript Type not supported`);
	}
	return cb(null, true);
};

/**
 * Filters updates from a request
 * @param {Object} req - request object
 * @param {ID} userId - user's id
 */
const genUpdates = async (req, userId, recording) => {
	return new Promise(async (resolve, reject) => {
		try {
			const transcripts = req.transcripts.map(t =>
				sanitizeTranscriptAndAddId(t, userId),
			);
			const imageCaptions = req.imageCaptions.map(i =>
				sanitizeTranscriptAndAddId(i, userId),
			);
			const soundCaptions = req.soundCaptions.map(s =>
				sanitizeTranscriptAndAddId(s, userId),
			);
			const uniqueWordsSpeech = [];
			const uniqueWordsImage = [];
			const uniqueWordsSound = [];
			const speakers = [];
			if (transcripts[0].path !== 'ASR_TEMP') {
				try {
					const parsedTranscript = await transcriptParser(transcripts[0].path);
					uniqueWordsSpeech.push(...parsedTranscript.speechSegments);
					uniqueWordsImage.push(...parsedTranscript.imageSegments);
					uniqueWordsSound.push(...parsedTranscript.soundSegments);
					speakers.push(...parsedTranscript.speakers);
				} catch (err) {
					console.error(`Unable to read file ${transcripts[0].path}`);
					console.error(err);
				}
			}
			let tx;
			for (tx of transcripts) {
				if (tx.path === 'ASR_TEMP') {
					const asrId = await asr.uploadFile(
						recording.path,
						tx.asrLanguage || 'english',
						req.audioType,
						req.audioTrack,
						// TODO: Implement token here
					);
					tx.asrId = asrId;
					const asrReq = new ASRRequest({
						asrId,
						recordingId: recording._id,
					});
					asrReq.save();
				}
			}
			if (imageCaptions.length > 0) {
				const {imageSegments} = await transcriptParser(imageCaptions[0].path);
				uniqueWordsImage.push(...imageSegments);
			}
			if (soundCaptions.length > 0) {
				const {soundSegments} = await transcriptParser(soundCaptions[0].path);
				uniqueWordsSound.push(...soundSegments);
			}
			const tags = req.tags.map(sanitizeTag);
			renameTempTranscripts(transcripts, 'transcripts');
			renameTempTranscripts(imageCaptions, 'transcripts');
			renameTempTranscripts(soundCaptions, 'transcripts');
			resolve({
				title: req.title,
				description: req.description,
				tags,
				transcripts,
				imageCaptions,
				soundCaptions,
				uniqueWordsSpeech,
				uniqueWordsImage,
				uniqueWordsSound,
				speakers,
			});
		} catch (err) {
			reject(utils.buildErrObject(422, err));
		}
	});
};

/**
 * Creates a new item in database
 * @param {Object} req - request object
 */
const createItem = async (req, id, token) => {
	return new Promise(async (resolve, reject) => {
		try {
			const transcripts = req.transcripts.map(transcript =>
				sanitizeTranscriptAndAddId(transcript, id),
			);
			const imageCaptions = req.imageCaptions.map(imageCaption =>
				sanitizeTranscriptAndAddId(imageCaption, id),
			);
			const soundCaptions = req.soundCaptions.map(soundCaption =>
				sanitizeTranscriptAndAddId(soundCaption, id),
			);
			const uniqueWordsSpeech = [];
			const uniqueWordsImage = [];
			const uniqueWordsSound = [];
			const speakers = [];
			if (transcripts[0].path === 'ASR_TEMP') {
				// Generate Transcript from ASR
				const asrId = await asr.uploadFile(
					req.path,
					transcripts[0].asrLanguage || 'english',
					req.audioType,
					req.audioTrack,
					token,
				);
				transcripts[0].asrId = asrId;
			} else {
				try {
					const parsedTranscript = await transcriptParser(transcripts[0].path);
					uniqueWordsSpeech.push(...parsedTranscript.speechSegments);
					uniqueWordsImage.push(...parsedTranscript.imageSegments);
					uniqueWordsSound.push(...parsedTranscript.soundSegments);
					speakers.push(...parsedTranscript.speakers);
				} catch (err) {
					console.error('Unable to read', transcripts[0].path);
					console.error(err);
				}
			}
			if (imageCaptions.length > 0) {
				const {imageSegments} = await transcriptParser(
					imageCaptions[0].path,
					captionTypes.IMAGE,
				);
				uniqueWordsImage.push(...imageSegments);
			}
			if (soundCaptions.length > 0) {
				const {soundSegments} = await transcriptParser(
					soundCaptions[0].path,
					captionTypes.SOUND,
				);
				uniqueWordsSound.push(...soundSegments);
			}
			const durationInSeconds = await genVideoDuration(req.path);
			const thumbnailPath = await genThumbnail(req.path);
			const newRecordingPath = renameTempFile(req.path, 'recordings');
			renameTempTranscripts(transcripts, 'transcripts');
			renameTempTranscripts(imageCaptions, 'transcripts');
			renameTempTranscripts(soundCaptions, 'transcripts');
			const Recording = new model({
				title: req.title,
				description: req.description,
				path: newRecordingPath,
				url: req.url,
				transcripts,
				imageCaptions,
				soundCaptions,
				defaultTranscript: req.defaultTranscript,
				uploaderId: id,
				tags: req.tags.map(sanitizeTag),
				uniqueWordsSpeech,
				uniqueWordsImage,
				uniqueWordsSound,
				speakers,
				durationInSeconds,
				thumbnailPath,
			});
			Recording.save((err, item) => {
				if (err) {
					reject(utils.buildErrObject(422, err.message));
				} else {
					const recObj = item.toObject();
					if (recObj.transcripts[0].path === 'ASR_TEMP') {
						const asrReq = new ASRRequest({
							asrId: recObj.transcripts[0].asrId,
							recordingId: recObj._id,
						});
						asrReq.save();
					}
					resolve(recObj);
				}
			});
		} catch (err) {
			reject(utils.buildErrObject(422, err));
		}
	});
};

const flattenTranscripts = (results, queryWords, segment) => {
	return new Promise(async (resolve, reject) => {
		let doc;
		for (doc of results.docs) {
			doc.relevantSegments = [];
			// eslint-disable-next-line
			try {
				let defaultTranscriptId = doc['_defaultTranscript'];

				if (defaultTranscriptId === undefined) {
					continue;
				}

				let defaultTranscript = await transcriptModel.findById(
					defaultTranscriptId,
				);

				if (defaultTranscript === null) {
					continue;
				}

				let defaultTranscriptPath = defaultTranscript['tempResourceUrl'];

				const {
					speechSegments = [],
					imageSegments = [],
					soundSegments = [],
				} = await transcriptProvider(defaultTranscriptPath);
				const allSegments = [
					...speechSegments,
					...imageSegments,
					...soundSegments,
				];
				let speechSegment;
				let word;
				let selectedSegments = allSegments;
				if (segment === 'image') {
					selectedSegments = imageSegments;
				} else if (segment === 'sound') {
					selectedSegments = soundSegments;
				}
				for (speechSegment of selectedSegments) {
					for (word of queryWords) {
						// eslint-disable-next-line
						if (speechSegment.match(new RegExp(word, 'i'))) {
							doc.relevantSegments.push(speechSegment);
						}
					}
				}
			} catch (err) {
				if (err.code === 'ENOENT') {
					// Transcript still being generated by ASR
					continue;
				} else {
					reject(err);
				}
			}
		}
		resolve(results);
	});
};

const parseCaptionsQuery = query => {
	const ret = {};
	if (query.$text) {
		ret.all = query.$text.$search.toLowerCase().split(' ');
	} else if (
		query.$or &&
		(query.$or.uniqueWordsSpeech ||
			query.$or.uniqueWordsSound ||
			query.$or.uniqueWordsImage)
	) {
		query.$or.forEach(f => {
			const key = Object.keys(f)[0];
			const value = f[key].$regex.toLowerCase().match(/[^|()]+/g);
			ret[key] = value;
		});
	}
	return ret;
};

/********************
 * Public functions *
 ********************/

/**
 * Upload Recording called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.uploadRecording = async (req, res) => {
	try {
		const upload = multer({
			storage: getStorageObject('public/temp/'),
			fileFilter: filterFileByMime(['audio', 'video']),
		}).single('recording');

		upload(req, res, async err => {
			if (err) {
				res.status(422).send({error: err});
			} else {
				// Azure file upload
				const filePath = req.file.path;
				const fileName = path.basename(filePath);
				console.log(`Uploading ${fileName} to azure from:`, filePath);
				const uploadedFileURL = await uploadRecordingFromPath(
					filePath,
					fileName,
				);
				console.log('Uploaded to file URL:', uploadedFileURL, fileName);

				res.status(200).send({
					success: {
						path: req.file.path,
						url: uploadedFileURL,
					},
				});
			}
		});
	} catch (error) {
		utils.handleError(res, error);
	}
};

/**
 * Upload Transcript called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.uploadTranscript = async (req, res) => {
	try {
		const upload = multer({
			storage: getStorageObject('public/temp/'),
			fileFilter: filterTranscript,
		}).single('transcript');
		upload(req, res, err => {
			if (err) {
				res.status(422).send({error: err});
			} else {
				res.status(200).send({
					success: {
						path: req.file.path,
					},
				});
			}
		});
	} catch (error) {
		utils.handleError(res, error);
	}
};

exports.updateTranscript = async (req, res) => {
	try {
		const upload = multer({
			storage: getStorageObject('public/temp/'),
			fileFilter: filterTranscript,
		}).single('transcript');
		upload(req, res, err => {
			if (err) {
				res.status(422).send({error: err});
			} else {
				res.status(200).send({
					success: {
						path: req.file.path,
					},
				});
			}
		});
	} catch (error) {
		utils.handleError(res, error);
	}
};

/**
 * Get items function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getItems = async (req, res) => {
	try {
		const query = await db.checkQueryString(req.query);
		query['publishStatus'] = 'public';
		// search in media table
		const results = await db.getItems(req, mediaModel, query);

		// simple parsing of the query
		const parsedQuery = parseCaptionsQuery(query);

		if (parsedQuery.all || parsedQuery.uniqueWordsSpeech) {
			const text = parsedQuery.all || parsedQuery.uniqueWordsSpeech;
			const newResults = await flattenTranscripts(results, text);
			res.status(200).json(newResults);
		} else if (parsedQuery.uniqueWordsImage) {
			const text = parsedQuery.uniqueWordsImage;
			const newResults = await flattenTranscripts(results, text, 'image');
			res.status(200).json(newResults);
		} else if (parsedQuery.uniqueWordsSound) {
			const text = parsedQuery.uniqueWordsSound;
			const newResults = await flattenTranscripts(results, text, 'sound');
			res.status(200).json(newResults);
		} else {
			res.status(200).json(results);
		}
	} catch (error) {
		utils.handleError(res, error);
	}
};

/**
 * Get items uploaded by user function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getUserUploads = async (req, res) => {
	try {
		const uploaderId = await utils.isIDGood(req.user.id);
		const results = await db.getItems(req, mediaModel, {uploaderId});
		res.status(200).json(results);
	} catch (error) {
		utils.handleError(res, error);
	}
};

/**
 * Get item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getItem = async (req, res) => {
	try {
		req = matchedData(req);
		const id = await utils.isIDGood(req.id);
		res.status(200).json(await db.getItem(id, mediaModel));
	} catch (error) {
		utils.handleError(res, error);
	}
};

/**
 * Update item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.updateItem = async (req, res) => {
	try {
		const id = await utils.isIDGood(req.params.id);
		const userId = await utils.isIDGood(req.user.id);
		req = matchedData(req);
		const recording = await model.findById(id);
		const updates = await genUpdates(req, userId, recording);
		res.status(200).json(await db.updateItem(id, model, updates));
	} catch (error) {
		utils.handleError(res, error);
	}
};

/**
 * regenerateEmbeddings item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
// exports.regenerateEmbeddings = async (req, res) => {
// 	try {
// 		req = matchedData(req);
// 		const id = await utils.isIDGood(req.id);
// 		const embeddings = await genEmbeddings(id);
// 		res.status(200).json({updated: 'OK', embeddings});
// 	} catch (error) {
// 		utils.handleError(res, error);
// 	}
// };

/**
 * Create item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.createItem = async (req, res) => {
	try {
		const token = req.headers.authorization;
		const id = await utils.isIDGood(req.user.id);
		req = matchedData(req);
		const item = await createItem(req, id, token);
		res.status(201).json(item);
	} catch (error) {
		utils.handleError(res, error);
	}
};

/**
 * Regenerate Unique words
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.regenUniqueWords = async (req, res) => {
	try {
		req = matchedData(req);
		const recordings = await model.find({});
		let recording;
		for (recording of recordings) {
			try {
				const uniqueWordsSpeech = [];
				const uniqueWordsImage = [];
				const uniqueWordsSound = [];
				const speakers = [];
				if (recording.transcripts[0].path !== 'ASR_TEMP') {
					const parsedTranscript = await transcriptParser(
						recording.transcripts[0].path,
					);
					uniqueWordsSpeech.push(...parsedTranscript.speechSegments);
					uniqueWordsImage.push(...parsedTranscript.imageSegments);
					uniqueWordsSound.push(...parsedTranscript.soundSegments);
					speakers.push(...parsedTranscript.speakers);
				}
				if (recording.imageCaptions[0]) {
					const {imageSegments} = await transcriptParser(
						recording.imageCaptions[0].path,
					);
					uniqueWordsImage.push(...imageSegments);
				}
				if (recording.soundCaptions[0]) {
					const {soundSegments} = await transcriptParser(
						recording.soundCaptions[0].path,
					);
					uniqueWordsSound.push(...soundSegments);
				}
				// recording.durationInSeconds = await genVideoDuration(recording.path);
				// recording.thumbnailPath = await genThumbnail(recording.path);
				recording.uniqueWordsSpeech = uniqueWordsSpeech;
				recording.uniqueWordsImage = uniqueWordsImage;
				recording.uniqueWordsSound = uniqueWordsSound;
				recording.speakers = speakers;
				recording.save();
			} catch (error) {
				console.error(recording._id, recording.title, error);
				continue;
			}
		}
		res.status(200).send({OK: true});
	} catch (error) {
		utils.handleError(res, error);
	}
};

/**
 * Delete item function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.deleteItem = async (req, res) => {
	try {
		req = matchedData(req);
		const id = await utils.isIDGood(req.id);
		const recording = await db.getItem(id, model);
		const paths = [
			recording.path,
			recording.thumbnailPath,
			...recording.transcripts.map(t => t.path),
		].filter(p => typeof p === 'string' && p !== defaultImage);
		paths.forEach(p => {
			try {
				fs.unlinkSync(p);
			} catch (err) {
				console.error(err);
			}
		});
		res.status(200).json({model: await db.deleteItem(id, model), paths});
	} catch (error) {
		utils.handleError(res, error);
	}
};

exports.updateStatus = async (req, res) => {
	console.log('Received status update:', req.body._id, req.body.status);
	if (req.body.status != 'done') {
		res.send(true);
		return;
	}
	try {
		const asrId = req.body._id;
		const link = req.body.result;
		await fetchAndUpdateASR(asrId, link);
	} catch (err) {
		console.log('ERROR IN UPDATE STATUS', err);
	} finally {
		res.send(true);
	}
};

/**
 * Check ASR called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.checkIfASRTranscriptReady = async (req, res) => {
	try {
		const token = req.headers.authorization;
		const id = await utils.isIDGood(req.params.recordingId);
		const asrId = req.params.asrId;
		const asrReq = await ASRRequest.findOne({asrId});
		const recording = await model.findById(id);
		let transcript;
		let result;
		for (transcript of recording.transcripts) {
			if (transcript.path === 'ASR_TEMP' && transcript.asrId === asrId) {
				result = await asr.checkStatus(asrId, token);
				if (result.status === 'done') {
					const srtPath = await asr.retrieveTranscripts(asrId, token);
					transcript.path = srtPath;
					asrReq.completed = true;
					asrReq.save();
					// eslint-disable-next-line max-depth
					if (recording.transcripts.indexOf(transcript) === 0) {
						// repopulate data if default transcript
						const parsedTranscript = await transcriptParser(srtPath);
						recording.uniqueWordsSpeech = parsedTranscript.speechSegments;
						recording.uniqueWordsImage = parsedTranscript.imageSegments;
						recording.uniqueWordsSound = parsedTranscript.soundSegments;
						recording.speakers = parsedTranscript.speakers;
					}
				}
				break;
			}
		}
		recording.save();
		res.status(200).send({
			transcript,
			result,
		});
	} catch (error) {
		utils.handleError(res, error);
	}
};
