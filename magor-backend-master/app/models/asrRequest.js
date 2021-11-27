const mongoose = require('mongoose');
const mongoosePaginate = require('mongoose-paginate-v2');

const ASRRequest = new mongoose.Schema({
	recordingId: {
		type: mongoose.Schema.Types.ObjectId,
		required: true,
	},
	asrId: {
		type: String,
		required: true,
	},
	completed: {
		type: Boolean,
		default: false,
	},
	date: {
		type: Date,
		default: Date.now(),
	},
});

ASRRequest.plugin(mongoosePaginate);
module.exports = mongoose.model('ASRRequest', ASRRequest);
