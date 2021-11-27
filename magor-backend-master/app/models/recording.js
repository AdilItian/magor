const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');
const ObjectId = mongoose.Schema.ObjectId;

const TranscriptSchema = new mongoose.Schema({
	path: {
		type: String,
		required: true,
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
	version: {
		type: Number,
		required: true,
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

const RecordingSchema = new mongoose.Schema(
	{
		title: {
			type: String,
			required: true,
		},
		description: String,
		path: {
			type: String,
			required: true,
		},
		url: {
			type: String,
			required: true
		},
		transcripts: [TranscriptSchema],
		imageCaptions: [TranscriptSchema],
		soundCaptions: [TranscriptSchema],
		defaultTranscript: Number,
		uploaderId: {
			type: ObjectId,
			required: true,
		},
		uploadDate: {
			type: Date,
			default: Date.now,
		},
		tags: [TagSchema],
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
		durationInSeconds: Number,
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

RecordingSchema.plugin(mongoosePaginate);
RecordingSchema.index(
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
module.exports = mongoose.model('Recording', RecordingSchema);
