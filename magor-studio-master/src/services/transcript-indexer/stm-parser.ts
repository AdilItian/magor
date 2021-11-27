/* eslint-disable */
// @ts-nocheck

const { isEmpty, isFloat } = require('validator');
const parseLine = line => {
	const [
		fileName,
		num,
		speakerId,
		startTime,
		endTime,
		tags,
		...transcript
	] = line.split(' ');
	if (
		fileName == null ||
		num == null ||
		speakerId == null ||
		startTime == null ||
		endTime == null ||
		tags == null
	)
		return null;
	let tagsValid = true;
	let transcriptText = transcript.join(' ');
	if (isEmpty(fileName, { ignore_whitespace: true })) return null;
	// if (!isInt(num)) return null;
	if (!isFloat(startTime)) return null;
	if (!isFloat(endTime)) return null;
	if (!tags.match(/^<.*>$/)) {
		transcriptText = tags + ' ' + transcriptText;
		tagsValid = false;
	}
	if (isEmpty(transcriptText, { ignore_whitespace: true })) return null;
	return {
		fileName,
		num: parseInt(num),
		speakerId,
		startTime: parseFloat(startTime) * 1000,
		endTime: parseFloat(endTime) * 1000,
		tags: !tagsValid ? null : tags.substr(1, tags.length - 2).split(','),
		transcript: transcriptText,
	};
};

export default (text) => {
	const lines = text.split('\n');
	const validBlocks = lines.map(parseLine).filter(line => line != null);
	return validBlocks;
};
