require('dotenv-safe').config();
const fs = require('fs');
const path = require('path');
const axios = require('axios');
const unzipper = require('unzipper');
const formData = require('form-data');

const hostname = 'https://gateway.speechlab.sg';
const loginPath = '/auth/login';
const uploadPath = '/speech';
const statusPath = id => `/speech/${id}`;
const resultPath = id => `/speech/${id}/result`;

const baseZipPath = path.join('public/temp');
const baseTxPath = path.join('public/transcripts');

const authHeaders = token => ({headers: {Authorization: `Bearer ${token}`}});

const login = () => {
	return new Promise(async (resolve, reject) => {
		try {
			const data = await axios.post(`${hostname}${loginPath}`, {
				email: process.env.ASR_EMAIL,
				password: process.env.ASR_PASSWORD,
			});
			resolve(data.data.accessToken);
		} catch (err) {
			reject(err.response.statusText);
		}
	});
};

const upload = (recPath, language, audioType, audioTrack, token) => {
	return new Promise(async (resolve, reject) => {
		try {
			const form = new formData();
			form.append('file', fs.createReadStream(recPath), {
				knownLength: fs.statSync(recPath).size,
			});
			form.append('lang', language);
			form.append('audioType', audioType || 'closetalk');
			form.append('audioTrack', audioTrack || 'single');
			form.append('outputFormats[]', 'xml');
			const webhookURL = `${process.env.WEBHOOK_URL}/recordings/status`;
			console.log('Sending webhook URL: ', webhookURL);
			form.append('webhook', webhookURL);
			const data = await axios.post(`${hostname}${uploadPath}`, form, {
				headers: {
					...form.getHeaders(),
					'Content-Length': form.getLengthSync(),
					Authorization: token,
				},
				maxContentLength: Infinity,
				maxBodyLength: Infinity,
			});
			resolve(data.data._id);
		} catch (err) {
			console.log(err.response);
			if (err.response) {
				reject(`ASR: ${err.response.data.error}`);
			} else if (err.request) {
				console.log(err.request);
			}
			reject(err);
		}
	});
};

const checkStatus = (asrId, token = undefined) => {
	return new Promise(async (resolve, reject) => {
		try {
			if (!token) {
				token = await login();
			} else {
				token = token.replace('Bearer ', '').trim();
			}
			const status = await axios.get(
				`${hostname}${statusPath(asrId)}`,
				authHeaders(token),
			);
			resolve(status.data);
		} catch (err) {
			reject(err);
		}
	});
};

const genTranscripts = (asrId, token, dataLink) => {
	return new Promise(async (resolve, reject) => {
		const fileName = `${baseZipPath}/t-${Number(new Date())}.zip`;
		const out = fs.createWriteStream(fileName, {encoding: null});
		const response =
			!dataLink &&
			(await axios.get(`${hostname}${resultPath(asrId)}`, {
				headers: {
					Authorization: token,
				},
			}));
		const fileURL = (response && response.data.url) || dataLink;
		const zip = await axios.get(fileURL, {
			responseType: 'stream',
		});
		zip.data.pipe(out);
		out.once('finish', () => resolve(fileName));
		out.on('error', reject);
	});
};

const unzipAndMoveSRT = zipPath => {
	return new Promise(async (resolve, reject) => {
		try {
			let srtPath;
			fs.createReadStream(zipPath)
				.pipe(unzipper.Parse())
				.on('entry', entry => {
					if (entry.path.match(/\.xml$/i)) {
						srtPath = entry.path.match(/[^/.]+\.xml$/i)[0][1];
						srtPath = `${baseTxPath}/${srtPath}-${Number(new Date())}.xml`;
						entry.pipe(fs.createWriteStream(srtPath));
					} else {
						entry.autodrain();
					}
				})
				.promise()
				.then(() => {
					if (srtPath) {
						resolve(srtPath);
					} else {
						reject(new Error('No SRT Found'));
					}
				})
				.catch(reject);
		} catch (err) {
			reject(err);
		}
	});
};

const deleteZip = zipPath => {
	return new Promise(async (resolve, reject) => {
		try {
			fs.unlinkSync(zipPath);
			resolve(true);
		} catch (err) {
			reject(err);
		}
	});
};

const uploadFile = (recPath, language, audioType, audioTrack, token) => {
	return new Promise(async (resolve, reject) => {
		try {
			// const token = await login();
			console.log('uploadFile', token);
			const asrId = await upload(
				recPath,
				language,
				audioType,
				audioTrack,
				token,
			);
			resolve(asrId);
		} catch (err) {
			reject(err);
		}
	});
};

const retrieveTranscripts = (asrId, token, dataLink) => {
	return new Promise(async (resolve, reject) => {
		try {
			if (!token && !dataLink) {
				token = 'Bearer ' + (await login());
			}
			const zipPath = await genTranscripts(asrId, token, dataLink);
			const srtPath = await unzipAndMoveSRT(zipPath);
			await deleteZip(zipPath);
			resolve(srtPath);
		} catch (err) {
			reject(err);
		}
	});
};

module.exports = {uploadFile, checkStatus, retrieveTranscripts};
