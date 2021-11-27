const ASRRequests = require('../models/asrRequest');
const Recordings = require('../models/recording');
const utils = require('../middleware/utils');

/**
 * Get stats function called by route
 * @param {Object} req - request object
 * @param {Object} res - response object
 */
exports.getStats = async (req, res) => {
	try {
		const recordingsAggregation = await Recordings.aggregate([
			{
				$group: {
					_id: false,

					count: {$sum: 1},

					averageDuration: {$avg: '$durationInSeconds'},
					maxDuration: {$max: '$durationInSeconds'},
					minDuration: {$min: '$durationInSeconds'},

					averageTags: {$avg: {$size: '$tags'}},
					maxTags: {$max: {$size: '$tags'}},
					minTags: {$min: {$size: '$tags'}},

					averageUniqueWords: {
						$avg: {
							$size: {
								$concatArrays: [
									'$uniqueWordsSpeech',
									'$uniqueWordsImage',
									'$uniqueWordsSound',
								],
							},
						},
					},
					maxUniqueWords: {
						$max: {
							$size: {
								$concatArrays: [
									'$uniqueWordsSpeech',
									'$uniqueWordsImage',
									'$uniqueWordsSound',
								],
							},
						},
					},
					minUniqueWords: {
						$min: {
							$size: {
								$concatArrays: [
									'$uniqueWordsSpeech',
									'$uniqueWordsImage',
									'$uniqueWordsSound',
								],
							},
						},
					},

					averageTranscripts: {
						$avg: {
							$size: {
								$concatArrays: [
									'$transcripts',
									'$imageCaptions',
									'$soundCaptions',
								],
							},
						},
					},
					maxTranscripts: {
						$max: {
							$size: {
								$concatArrays: [
									'$transcripts',
									'$imageCaptions',
									'$soundCaptions',
								],
							},
						},
					},
					minTranscripts: {
						$min: {
							$size: {
								$concatArrays: [
									'$transcripts',
									'$imageCaptions',
									'$soundCaptions',
								],
							},
						},
					},
				},
			},
			{$project: {_id: 0}},
		]);
		const mostPopularTags = await Recordings.aggregate([
			{
				$project: {
					tagNames: {$map: {input: '$tags', as: 'tag', in: '$$tag.tagName'}},
				},
			},
			{$unwind: '$tagNames'},
			{$sortByCount: '$tagNames'},
			{$limit: 10},
			{$project: {name: '$_id', _id: 0, count: '$count'}},
		]);
		const asrRequestsAggregation = await ASRRequests.aggregate([
			{
				$group: {
					_id: null,

					count: {$sum: 1},
					completed: {$sum: {$cond: {if: '$completed', then: 1, else: 0}}},
				},
			},
		]);
		const oldestPendingASR = await ASRRequests.aggregate([
			{$match: {completed: false}},
			{$sort: {date: 1}},
		]);
		res.status(200).json({
			recordings: {
				...recordingsAggregation[0],
				mostPopularTags,
			},
			asrRequests: {
				...asrRequestsAggregation[0],
				oldestPendingASR: oldestPendingASR[0],
			},
		});
	} catch (error) {
		utils.handleError(res, error);
	}
};
