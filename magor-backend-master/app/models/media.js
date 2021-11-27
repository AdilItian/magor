/* eslint-disable */

const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const shortid = require('shortid');

const ObjectId = mongoose.SchemaTypes.ObjectId;

const TranscriptSchema = new mongoose.Schema({
	path: {
		type: String,
		required: true,
	},
	url: {
		type: String,
	},
	asrId: String,
	format: {
		type: String,
		enum: ['srt', 'json', 'xml', 'youtube.json', 'textgrid', 'stm'],
	},
	uploaderId: {
		type: ObjectId,
		required: true,
	},
	uploadDate: {
		type: Date,
		default: Date.now,
	},
	name: String,
});

const TagSchema = new mongoose.Schema({
	tagName: {
		type: String,
		required: true,
	},
	source: {
		type: String,
		enum: ['manual', 'transcript', 'video', 'audio'],
		default: 'manual',
	},
	startTimeMs: Number,
	endTimeMs: Number,
});

const MediaSchema = new mongoose.Schema(
	{
		azureUploadStatus: {
			type: String,
			enum: ['pending', 'queue', 'progress', 'success', 'error', 'failure'],
			default: 'pending',
		},
		azureResourceUrl: {
			type: String,
			default: '',
		},
		azureUploadInfo: {
			type: String,
			default: '',
		},
		description: {
			type: String,
			default: '',
		},
		duration: {
			type: Number,
			default: 0,
		},
		linkId: {
			type: String,
			default: shortid.generate,
		},
		publishStatus: {
			type: String,
			enum: ['draft', 'public', 'private'],
			default: 'draft',
		},
		tempUploadStatus: {
			type: String,
			enum: ['pending', 'progress', 'success', 'error'],
			default: 'pending',
		},
		tempResourceUrl: {
			type: String,
			default: '',
		},
		title: {
			type: String,
			required: true,
		},
		uploaderId: {
			required: true,
			type: ObjectId,
			ref: 'user',
		},
		// TODO replace _ with original names
		_transcripts: [{type: ObjectId, ref: 'transcript'}],
		_imageCaptions: [{type: ObjectId, ref: 'transcript'}],
		_soundCaptions: [{type: ObjectId, ref: 'transcript'}],
		_defaultTranscript: {type: ObjectId, ref: 'transcript'},
		_defaultImageCaption: {type: ObjectId, ref: 'transcript'},
		_defaultSoundCaption: {type: ObjectId, ref: 'transcript'},
		uniqueWordsImage: {
			type: [String],
			select: false,
		},
		uniqueWordsSound: {
			type: [String],
			select: false,
		},
		uniqueWordsSpeech: {
			type: [String],
			select: false,
		},
		speakers: [String],
		/**=======================
		 *       LEGACY KEYS
		 *========================**/
		transcripts: [TranscriptSchema],
		imageCaptions: [TranscriptSchema],
		soundCaptions: [TranscriptSchema],
		defaultTranscript: Number,
		tags: [TagSchema],

		thumbnailPath: {
			type: String,
			default: '/public/images/audio.svg',
		},
	},
	{
		versionKey: false,
		timestamps: true,
	},
);

MediaSchema.plugin(mongoosePaginate);
MediaSchema.index(
	{
		title: 'text',
		description: 'text',
		uniqueWordsSpeech: 'text',
		uniqueWordsSound: 'text',
		uniqueWordsImage: 'text',
		'tags.tagName': 'text',
		speakers: 'text',
	},
	// eslint-disable-next-line camelcase
	{default_language: 'english'},
);

MediaSchema.plugin(mongoosePaginate);
MediaSchema.index(
	{
		title: 'text',
		description: 'text',
		uniqueWordsSpeech: 'text',
		uniqueWordsSound: 'text',
		uniqueWordsImage: 'text',
		'tags.tagName': 'text',
		speakers: 'text',
	},
	// eslint-disable-next-line camelcase
	{default_language: 'english'},
);

module.exports = mongoose.model('media', MediaSchema);
