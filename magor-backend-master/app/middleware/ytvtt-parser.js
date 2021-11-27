const YTVTTParser = text => {
	return new Promise((resolve, reject) => {
		try {
			const captions = [];
			const lines = text.split('\n');
			for (let i = 0; i < lines.length; i++) {
				const line1 = lines[i];
				const times = line1.match(
					/^(\d{2}):(\d{2}):(\d{2})[.,](\d{1,3}) --> (\d{2}):(\d{2}):(\d{2})[.,](\d{1,3})/,
				);
				if (times) {
					// Only move ahead if the current line has a valid timestamp
					// Youtube VTT has redundancy, based on preliminary observations, we found that
					// in YouTube's VVTs, the first line is the previous text, so we skip the first line after
					// the time stamps. We only care about the second line (as of April 2020)
					const ccLine = lines[i + 2];
					if (ccLine.match(/[^\s]/)) {
						// Make sure line is not empty
						// Ignore the first item in times (which is the entire match) and then convert all
						// time values to base-10 integers
						const [h1, m1, s1, ms1, h2, m2, s2, ms2] = times
							.slice(1)
							.map(t => parseInt(t, 10));
						const sTimeMs = ((h1 * 60 + m1) * 60 + s1) * 1000 + ms1;
						const eTimeMs = ((h2 * 60 + m2) * 60 + s2) * 1000 + ms2;
						// remove all tags of form <.*>, and only return text
						const ccText = ccLine.replace(/<[^>]*>/g, '');
						captions.push({sTimeMs, eTimeMs, text: ccText});
					}
				}
				// We have already parsed 3 lines after the time stamp:
				// First line after timestamp: previous CC which we don't care about
				// Second line after timestamp: The caption we are interested in
				// Third line after timestamp: Blank (as per VTT specification)
				// Hence i += 3 (note that there already is a i++ in the loop)
				i += 3;
			}
			resolve(captions);
		} catch (err) {
			reject(err);
		}
	});
};

module.exports = YTVTTParser;
