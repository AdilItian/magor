// @ts-nocheck

import nodejieba from 'nodejieba';
import { captionTypes } from './types';

nodejieba.load();

import transcriptProvider from './transcriptProvider';

export default (path, captionType = captionTypes.SPEECH) => {
	return new Promise(async (resolve, reject) => {
		try {
			const segments = await transcriptProvider(path, true, captionType);
			let seg;
			let t;
			const unique = {
				speechSegments: new Set(), // eslint-disable-line no-undef
				imageSegments: new Set(), // eslint-disable-line no-undef
				soundSegments: new Set(), // eslint-disable-line no-undef
			};
			for (t in segments) {
				if (t === 'speakers') {
					continue;
				}
				for (seg of segments[t]) {
					const parts = seg.split(' ');
					let part;
					for (part of parts) {
						// eslint-disable-next-line max-depth
						if (part.match(/[\u4e00-\u9fff]+/)) {
							// Contains Chinese Characters
							const w = nodejieba.cut(part);
							let word;
							// eslint-disable-next-line max-depth
							for (word of w) {
								unique[t].add(word);
							}
						} else {
							// Non-Chinese Characters Only
							unique[t].add(part);
						}
					}
				}
			}
			const realSpeakers = (segments.speakers || []).filter(
				// Speakers of the form 'S1', 'S123' etc are auto generated names and we shall neglect them
				s => !String(s).match(/^S\d+$/) && !String(s).match(/speaker/i),
			);
			const parsedParams = {
				speechSegments: Array.from(unique.speechSegments),
				imageSegments: Array.from(unique.imageSegments),
				soundSegments: Array.from(unique.soundSegments),
				speakers: realSpeakers,
			};
			resolve(parsedParams);
		} catch (err) {
			reject(err);
		}
	});
};
