// @ts-nocheck

import parseStm from './stm-parser';
import parseYTVTT from './ytvtt-parser';
const srt = require('subtitle');
import { promises as fs } from 'fs';
import xml2js from 'xml2js';

// const tg = require('praatio');
const { captionTypes } = require('./types');

const secondsToTimeStamp = s => {
	const sec = Math.floor(s);
	const ss = sec % 60;
	const mm = Math.floor(sec / 60) % 60;
	const hh = Math.floor(mm / 60);
	const times = hh === 0 ? [mm, ss] : [hh, mm, ss];
	return `${times.map(e => e.toString().padStart(2, '0')).join(':')} > `;
};

const flattenTranscriptObject = (
	json,
	raw,
	captionType = captionTypes.SPEECH,
) => {
	// eslint-disable-next-line complexity
	return new Promise((resolve, reject) => {
		const speechSegments = [];
		const imageSegments = [];
		const soundSegments = [];
		const speakers = new Set(); // eslint-disable-line no-undef
		try {
			let segmentList;
			if (captionType === captionTypes.SPEECH) {
				for (segmentList of json.AudioDoc.SegmentList || []) {
					let speechSegment;
					for (speechSegment of segmentList.SpeechSegment) {
						speakers.add(speechSegment.$.spkrid);
						const sentence = speechSegment.Word.map(w =>
							w._.toLowerCase(),
						).join(' ');
						speechSegments.push(
							raw
								? sentence
								: secondsToTimeStamp(speechSegment.$.stime) + sentence,
						);
					}
				}
			}
			let imageCaptionList;
			if (
				captionType === captionTypes.IMAGE ||
				captionType === captionTypes.SPEECH
			) {
				for (imageCaptionList of json.AudioDoc.ImageCaptionList || []) {
					let imageSegment;
					for (imageSegment of imageCaptionList.ImageSegment) {
						imageSegments.push(
							raw
								? imageSegment._.toLowerCase()
								: `${secondsToTimeStamp(imageSegment.$.stime)} [${imageSegment._
								}]`,
						);
					}
				}
			}
			let soundCaptionList;
			if (
				captionType === captionTypes.SOUND ||
				captionType === captionTypes.SPEECH
			) {
				for (soundCaptionList of json.AudioDoc.SoundCaptionList || []) {
					let soundSegment;
					for (soundSegment of soundCaptionList.SoundSegment) {
						soundSegments.push(
							raw
								? soundSegment._.toLowerCase()
								: `${secondsToTimeStamp(soundSegment.$.stime)} [${soundSegment._
								}]`,
						);
					}
				}
			}
			resolve({
				speechSegments,
				imageSegments,
				soundSegments,
				speakers: Array.from(speakers),
			});
		} catch (err) {
			reject(err);
		}
	});
};

const prepareYouTubeTranscript = json => {
	return new Promise((resolve, reject) => {
		const speechSegments = [];
		try {
			let event;
			for (event of json.events) {
				speechSegments.push(
					event.segs.map(seg => seg.utf8.toLowerCase()).join(' '),
				);
			}
			resolve({ speechSegments });
		} catch (err) {
			reject(err);
		}
	});
};

const prepareSRT = (textInput, raw) => {
	return new Promise((resolve, reject) => {
		const speechSegments = [];
		let text = textInput.replace(
			/(\d{2}:\d{2}:\d{2}[,.])(\d{1})([\n\r\s])/g,
			(_, a, b, c) => `${a}0${b}${c}`,
		);
		text = text.replace(
			/(\d{2}:\d{2}:\d{2}[,.])(\d{2})([\n\r\s])/g,
			(_, a, b, c) => `${a}0${b}${c}`,
		);
		const parsedSRT = srt.parse(text);
		try {
			let seg;
			for (seg of parsedSRT) {
				// eslint-disable-next-line
				if (seg.text == null) continue;
				const ssText = seg.text.replace(/<[^>]*>/g, '').replace('\n', ' ');
				speechSegments.push(
					raw
						? ssText.toLowerCase()
						: secondsToTimeStamp(seg.start) + ssText.toLowerCase(),
				);
			}
			resolve({ speechSegments });
		} catch (err) {
			reject(err);
		}
	});
};

const prepareYTVTT = (text, raw) => {
	return new Promise(async (resolve, reject) => {
		try {
			const speechSegments = [];
			const parsedYTVTT = await parseYTVTT(text);
			let seg;
			for (seg of parsedYTVTT) {
				speechSegments.push(
					raw
						? seg.text.toLowerCase()
						: secondsToTimeStamp(seg.sTimeMs / 1000) + seg.text.toLowerCase(),
				);
			}
			resolve({ speechSegments });
		} catch (err) {
			reject(err);
		}
	});
};

const prepareSTM = (text, raw) => {
	return new Promise((resolve, reject) => {
		const speechSegments = [];
		const parsedSTM = parseStm(text);
		try {
			let seg;
			for (seg of parsedSTM) {
				speechSegments.push(
					raw
						? seg.transcript.toLowerCase()
						: secondsToTimeStamp(seg.startTime) + seg.transcript.toLowerCase(),
				);
			}
			resolve({ speechSegments });
		} catch (err) {
			reject(err);
		}
	});
};

const prepareAsrXML = (text, raw, captionType = captionTypes.SPEECH) => {
	const { parseNumbers, parseBooleans } = xml2js.processors;
	const parser = new xml2js.Parser({
		trim: true,
		preserveChildrenOrder: true,
		attrValueProcessors: [parseNumbers, parseBooleans],
	});
	return new Promise(async (resolve, reject) => {
		parser.parseString(text, async (err, result) => {
			if (err) {
				reject(err);
			} else {
				resolve(await flattenTranscriptObject(result, raw, captionType));
			}
		});
	});
};

// const prepareTextGrid = text => {
// 	return new Promise((resolve, reject) => {
// 		const speechSegments = [];
// 		try {
// 			const parsedTG = tg.parseTextgrid(text);
// 			console.log(parsedTG);
// 			let tierName;
// 			let entry;
// 			for (tierName of parsedTG.tierNameList) {
// 				const tier = parsedTG.tierDict[tierName];
// 				for (entry of tier.entryList) {
// 					const transcript = entry[2];
// 					if (transcript === '--EMPTY--') {
// 						continue;
// 					}
// 					speechSegments.push(transcript.toLowerCase());
// 				}
// 			}
// 			resolve(speechSegments);
// 		} catch (err) {
// 			reject(err);
// 		}
// 	});
// };

export default async (
	transcriptUrl,
	raw = false,
	captionType = captionTypes.SPEECH,
) => {
	return new Promise((resolve, reject) => {
		try {
			fs.readFile(transcriptUrl, 'utf8')
				.then(async d => {
					if (transcriptUrl.match(/\.youtube\.json$/i)) {
						resolve(await prepareYouTubeTranscript(JSON.parse(d), raw));
					} else if (transcriptUrl.match(/\.json$/i)) {
						resolve(await flattenTranscriptObject(JSON.parse(d), raw));
					} else if (transcriptUrl.match(/\.xml$/i)) {
						resolve(await prepareAsrXML(d, raw, captionType));
					} else if (transcriptUrl.match(/\.yt\.vtt$/i)) {
						resolve(await prepareYTVTT(d, raw));
					} else if (transcriptUrl.match(/\.(srt|vtt)$/i)) {
						resolve(await prepareSRT(d, raw));
					} else if (transcriptUrl.match(/\.stm$/i)) {
						resolve(await prepareSTM(d, raw));
					} else if (transcriptUrl.match(/\.textgrid$/i)) {
						resolve([]);
					}
				})
				.catch(err => reject(err));
		} catch (err) {
			reject(err);
		}
	});
};
