// require('@tensorflow/tfjs-node');
// const use = require('@tensorflow-models/universal-sentence-encoder');
// const path = require('path');
// const fs = require('fs').promises;
//
// const model = require('../models/recording');
// const {itemNotFound} = require('./utils');
//
// const genLimitedSegments = recording => {
// 	return new Promise(async (resolve, reject) => {
// 		const transcriptPath = path.join(
// 			'public/transcripts/',
// 			recording.transcripts[0].path.match(/[^/]*$/)[0],
// 		);
// 		try {
// 			const transcript = await fs.readFile(transcriptPath, 'utf8');
// 			const json = JSON.parse(transcript);
// 			const speechSegmentsLim35 = [];
// 			json.AudioDoc.SegmentList.forEach(segmentList => {
// 				segmentList.SpeechSegment.forEach(speechSegment => {
// 					const ssl35Len = speechSegmentsLim35.length;
// 					if (
// 						ssl35Len === 0 ||
// 						true ||
// 						speechSegmentsLim35[ssl35Len - 1].length >= 35
// 					) {
// 						speechSegmentsLim35.push(speechSegment.Word.map(w => w._));
// 					} else {
// 						Array.prototype.push.apply(
// 							speechSegmentsLim35[ssl35Len - 1],
// 							speechSegment.Word.map(w => w._),
// 						);
// 					}
// 				});
// 			});
// 			resolve(speechSegmentsLim35);
// 		} catch (e) {
// 			reject(e);
// 		}
// 	});
// };
//
// const genEmbeddings = recordingId => {
// 	return new Promise((resolve, reject) => {
// 		model.findById(recordingId, async (err, recording) => {
// 			itemNotFound(err, recording, reject, 'NOT_FOUND');
// 			const limitedSegments = await genLimitedSegments(recording);
// 			const limitedSentences = await limitedSegments.map(seg => seg.join(' '));
// 			limitedSentences.push('teach kids using technology');
// 			const useModel = await use.load();
// 			const embeddings = await useModel.embed(limitedSentences);
// 			const scoreArray = [];
// 			for (
// 				let i = limitedSentences.length - 1;
// 				i < limitedSentences.length;
// 				i++
// 			) {
// 				for (let j = 0; j < limitedSentences.length; j++) {
// 					const sentenceI = embeddings.slice([i, 0], [1]);
// 					const sentenceJ = embeddings.slice([j, 0], [1]);
// 					const sentenceITranspose = false;
// 					const sentenceJTranspose = true;
// 					scoreArray.push(
// 						sentenceI
// 							.matMul(sentenceJ, sentenceITranspose, sentenceJTranspose)
// 							.dataSync()[0],
// 					);
// 				}
// 			}
// 			resolve({
// 				scoreArray: scoreArray.map(s => ({
// 					sent: limitedSentences[scoreArray.indexOf(s)],
// 					match: s > 0.5,
// 				})),
// 			});
// 		});
// 	});
// };
//
// module.exports.genEmbeddings = genEmbeddings;
