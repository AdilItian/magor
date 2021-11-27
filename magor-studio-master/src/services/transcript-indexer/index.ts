import Queue from "bull";
import _ from "lodash";
import logger from "../../config/logger";
import Media from "../../app/models/media";
import transcriptParser from "./transcriptParser";
import Transcript from "../../app/models/transcript";
import { captionTypes } from "./types";

const indexUniqueWords = async (mediaId: string) => {
  logger.info(`reindex start media ${mediaId}`);

  try {
    const media = await Media.findById(mediaId);

    const uniqueWordsSpeech = [];
    const uniqueWordsImage = [];
    const uniqueWordsSound = [];
    const speakers = [];

    // add checks to check if transcripts are available

    let defaultTranscriptId = _.get(media, "_defaultTranscript", "");
    let defaultTranscript = await Transcript.findById(defaultTranscriptId);
    let defaultTranscriptPath = _.get(defaultTranscript, "tempResourceUrl", "");

    if (_.isEmpty(defaultTranscriptPath)) {
      logger.error(`reindex error media ${mediaId}" file not found!`);
      throw new Error("file not found!");
    }

    const parsedTranscript: any = await transcriptParser(defaultTranscriptPath);

    uniqueWordsSpeech.push(...parsedTranscript.speechSegments);
    uniqueWordsImage.push(...parsedTranscript.imageSegments);
    uniqueWordsSound.push(...parsedTranscript.soundSegments);
    speakers.push(...parsedTranscript.speakers);

    let defaultImageCaptionId = _.get(media, "_defaultImageCaption", null);

    if (defaultImageCaptionId) {
      let defaultImageCaption = await Transcript.findById(
        defaultImageCaptionId
      );
      let defaultImageCaptionPath = _.get(
        defaultTranscript,
        "tempResourceUrl",
        ""
      );
      const parsedImageCaptions: any = await transcriptParser(
        defaultImageCaptionPath,
        captionTypes.IMAGE
      );
      uniqueWordsImage.push(...parsedImageCaptions.imageSegments);
    }

    let defaultSoundCaptionId = _.get(media, "_defaultSoundCaption", null);

    if (defaultSoundCaptionId) {
      let defaultSoundCaption = await Transcript.findById(
        defaultSoundCaptionId
      );
      let defaultSoundCaptionPath = _.get(
        defaultTranscript,
        "tempResourceUrl",
        ""
      );
      const parsedSoundCaptions: any = await transcriptParser(
        defaultSoundCaptionPath,
        captionTypes.SOUND
      );
      uniqueWordsSound.push(...parsedSoundCaptions.imageSegments);
    }

    media["uniqueWordsSpeech"] = uniqueWordsSpeech;
    media["uniqueWordsImage"] = uniqueWordsImage;
    media["uniqueWordsSound"] = uniqueWordsSound;

    await media.save();

    logger.info(`reindex success media ${mediaId}`);

    console.log(media);

    return true;
  } catch (error) {
    logger.error(`reindex error media ${mediaId}`);
    logger.error(error);
    throw error;
  }
};

const indexQueue = new Queue("index");

const CONCURRENT_UPLOAD_PROCESSES = 3;

indexQueue.process(CONCURRENT_UPLOAD_PROCESSES, async (job, done) => {
  const mediaId = job.data.id;
  console.log(`media index start ${mediaId}`);
  try {
    await indexUniqueWords(mediaId);
    done(null, true);
  } catch (error) {
    done(error, null);
  }
});

indexQueue.on("completed", async (job, result) => {
  if (!job.data.id) return;
  console.log(`Successfully indexed media ${job.data.id}!`);
});

indexQueue.on("failed", (job, error) => {
  console.log(`>  ${job.queue.name}: job: ${job.data.id} failed.`);
  console.error(error);
});

export const addMediaToIndexQueue = (mediaId: string) => {
  indexQueue.add(
    {
      id: mediaId,
    },
    {
      attempts: 5,
      backoff: 5000,
    }
  );
};
