import parseStm from './Utils/stm-parser'
import parseYTVTT from './Utils/ytvtt-parser'
import topWords from './Utils/topWords'
import { captionTypes } from './Utils/uploadInputValidators'
import { TextGrid } from 'textgrid'
import axios from 'axios'
import _ from 'lodash'
const srt = require('subtitle')
// const vtt = require('node-webvtt');
const xml2js = require('xml2js')

const getSpeechSubSegments = (words) => {
    const speechSubSegments = []
    while (words.length !== 0) {
        const w = words.splice(0, 10)
        const startTime = parseInt(w[0].stime * 1000)
        const endTime = parseInt(
            (w[w.length - 1].stime + w[w.length - 1].dur) * 1000
        )
        speechSubSegments.push({
            startTime,
            endTime,
            id: `sss_${startTime}_${endTime}`,
            words: w.map((w) => w._),
        })
    }
    return speechSubSegments
}

const getSpeechSubSegmentsLinear = (ssStartTimeMs, ssEndTimeMs, words) => {
    const speechSubSegments = []
    const avgTimePerWord =
        parseFloat(ssEndTimeMs - ssStartTimeMs) / words.length
    let wordCount = 0
    while (words.length !== 0) {
        const w = words.splice(0, 10)
        const startTime = Math.floor(ssStartTimeMs + wordCount * avgTimePerWord)
        const endTime = Math.floor(startTime + w.length * avgTimePerWord)
        speechSubSegments.push({
            startTime,
            endTime,
            id: `sss_${startTime}_${endTime}`,
            words: w.map((w) => w),
        })
        wordCount += w.length
    }
    return speechSubSegments
}

export const flattenTranscriptObject = (json, captionType) => {
    return new Promise((resolve, reject) => {
        const originalSpeechSegments = []
        const speechSegments = []
        const imageSegments = []
        const soundSegments = []
        const speakers = new Set()
        try {
            const {
                SegmentList = [],
                ImageCaptionList = [],
                SoundCaptionList = [],
            } = json.AudioDoc
            for (let segmentList of SegmentList) {
                for (let speechSegment of segmentList.SpeechSegment) {
                    originalSpeechSegments.push(speechSegment)
                }
            }
            originalSpeechSegments.sort((s1, s2) => s1.$.stime - s2.$.stime)
            if (captionType === captionTypes.SPEECH) {
                for (let speechSegment of originalSpeechSegments) {
                    const lastSpeechSegment =
                        speechSegments[speechSegments.length - 1]
                    if (
                        speechSegments.length === 0 ||
                        lastSpeechSegment.speakerId !==
                            speechSegment.$.spkrid ||
                        ((speechSegment.$.emotion ||
                            lastSpeechSegment.emotion) &&
                            lastSpeechSegment.emotion !==
                                speechSegment.$.emotion) ||
                        speechSegments[
                            speechSegments.length - 1
                        ].speechSubSegments.reduce(
                            (p, c) => (p = p + c.words.length),
                            0
                        ) > 20
                    ) {
                        const startTime = parseInt(speechSegment.$.stime * 1000)
                        const endTime =
                            startTime + parseInt(speechSegment.$.dur * 1000)
                        speakers.add(speechSegment.$.spkrid)
                        speechSegments.push({
                            gender: speechSegment.$.gender,
                            emotion: speechSegment.$.emotion,
                            language: speechSegment.$.lang,
                            speakerId: speechSegment.$.spkrid,
                            startTime,
                            endTime,
                            speechSubSegments: getSpeechSubSegments(
                                speechSegment.Word
                            ),
                            id: `ss_${startTime}_${endTime}`,
                        })
                    } else {
                        const ss = lastSpeechSegment
                        ss.endTime = ss.endTime + speechSegment.$.dur * 1000
                        ss.id = `ss_${ss.startTime}_${ss.endTime}`
                        Array.prototype.push.apply(
                            ss.speechSubSegments,
                            getSpeechSubSegments(speechSegment.Word)
                        )
                    }
                }
            }
            if (
                captionType === captionTypes.IMAGE ||
                captionType === captionTypes.SPEECH
            ) {
                for (let imageCaptionList of ImageCaptionList) {
                    for (let imageSegment of imageCaptionList.ImageSegment) {
                        const startTime = imageSegment.stime * 1000
                        const endTime = startTime + imageSegment.dur * 1000
                        const speakerId = 'imageCaption'
                        imageSegments.push({
                            startTime,
                            endTime,
                            speechSubSegments: [
                                {
                                    startTime,
                                    endTime,
                                    id: `img_ss_${startTime}_${endTime}`,
                                    words: imageSegment._.split(' '),
                                },
                            ],
                            id: `img_${startTime}_${endTime}`,
                            speakerId,
                        })
                    }
                }
            }
            if (
                captionType === captionTypes.SOUND ||
                captionType === captionTypes.SPEECH
            ) {
                for (let soundCaptionList of SoundCaptionList) {
                    for (let soundSegment of soundCaptionList.SoundSegment) {
                        const startTime = soundSegment.stime * 1000
                        const endTime = startTime + soundSegment.dur * 1000
                        const speakerId = 'soundCaption'
                        soundSegments.push({
                            startTime,
                            endTime,
                            speechSubSegments: [
                                {
                                    startTime,
                                    endTime,
                                    id: `snd_ss_${startTime}_${endTime}`,
                                    words: soundSegment._.split(' '),
                                },
                            ],
                            caption: soundSegment._,
                            id: `snd_${startTime}_${endTime}`,
                            speakerId,
                        })
                    }
                }
            }
            resolve([
                [...speakers],
                speechSegments,
                imageSegments,
                soundSegments,
            ])
        } catch (err) {
            reject(err)
        }
    })
}

const prepareYouTubeTranscript = (json) => {
    return new Promise((resolve, reject) => {
        const speechSegments = []
        try {
            for (let event of json.events) {
                const startTime = event.tStartMs
                const endTime = event.tStartMs + event.dDurationMs
                speechSegments.push({
                    gender: null,
                    language: null,
                    speakerId: 'Speaker',
                    startTime,
                    endTime,
                    speechSubSegments: [
                        {
                            startTime,
                            endTime,
                            id: `sss_${startTime}_${endTime}`,
                            words: event.segs
                                .map((seg) => seg.utf8)
                                .join(' ')
                                .split(' '),
                        },
                    ],
                    id: `ss_${startTime}_${endTime}`,
                })
            }
            resolve([['Speaker'], speechSegments])
        } catch (err) {
            reject(err)
        }
    })
}

const prepareYTVTT = (text) => {
    return new Promise(async (resolve, reject) => {
        const speechSegments = []
        try {
            const parsedYTVTT = await parseYTVTT(text)
            for (let cc of parsedYTVTT) {
                const { sTimeMs, eTimeMs, text } = cc
                speechSegments.push({
                    gender: null,
                    language: null,
                    speakerId: 'Speaker',
                    startTime: sTimeMs,
                    endTime: eTimeMs,
                    speechSubSegments: getSpeechSubSegmentsLinear(
                        sTimeMs,
                        eTimeMs,
                        text.split(' ')
                    ),
                    id: `ss_${sTimeMs}_${eTimeMs}`,
                })
            }
            resolve([['Speaker'], speechSegments])
        } catch (err) {
            reject(err)
        }
    })
}

const prepareSRT = (text) => {
    return new Promise((resolve, reject) => {
        const speechSegments = []
        let ppText = text.replace(
            /(\d{2}:\d{2}:\d{2}[,.])(\d{1})([\n\r\s])/g,
            (_, a, b, c) => `${a}0${b}${c}`
        )
        ppText = text.replace(
            /(\d{2}:\d{2}:\d{2}[,.])(\d{2})([\n\r\s])/g,
            (_, a, b, c) => `${a}0${b}${c}`
        )
        const parsedSRT = srt.parse(ppText)
        try {
            for (let seg of parsedSRT) {
                const { start, end, text: rawText } = seg
                if (start == null || end == null || rawText == null) continue
                if (end - start < 250) continue
                let text = rawText
                text = text.replace(/<[^>]+>/g, '')
                speechSegments.push({
                    gender: null,
                    language: null,
                    speakerId: 'Speaker',
                    startTime: start,
                    endTime: end,
                    speechSubSegments: getSpeechSubSegmentsLinear(
                        start,
                        end,
                        text.split(' ')
                    ),
                    id: `ss_${start}_${end}`,
                })
            }
            resolve([['Speaker'], speechSegments])
        } catch (err) {
            reject(err)
        }
    })
}

const prepareSTM = (text) => {
    return new Promise((resolve, reject) => {
        const speechSegments = []
        const parsedSTM = parseStm(text)
        const speakers = new Set()
        try {
            for (let seg of parsedSTM) {
                const {
                    startTime,
                    endTime,
                    speakerId = 'Speaker',
                    transcript,
                } = seg
                speakers.add(speakerId)
                speechSegments.push({
                    gender: null,
                    language: null,
                    speakerId: speakerId,
                    startTime,
                    endTime,
                    speechSubSegments: getSpeechSubSegmentsLinear(
                        startTime,
                        endTime,
                        transcript.split(' ')
                    ),
                    id: `ss_${startTime}_${endTime}`,
                })
            }
            resolve([[...speakers], speechSegments])
        } catch (err) {
            reject(err)
        }
    })
}

const prepareTextGrid = (text) => {
    return new Promise((resolve, reject) => {
        const speechSegments = []
        const speakers = new Set()
        try {
            const parsedTG = TextGrid.textgridToJSON(text)
            for (let item of parsedTG.items) {
                const tierName = item.name
                for (let interval of item.intervals) {
                    const { xmin: startTimeS, xmax: endTimeS, text } = interval
                    if (text === '--EMPTY--' || text === '') continue
                    const startTime = startTimeS * 1000
                    const endTime = endTimeS * 1000
                    speakers.add(tierName)
                    speechSegments.push({
                        gender: null,
                        language: null,
                        speakerId: tierName,
                        startTime,
                        endTime,
                        speechSubSegments: getSpeechSubSegmentsLinear(
                            startTime,
                            endTime,
                            text.split(' ')
                        ),
                        id: `ss_${startTime}_${endTime}`,
                    })
                }
            }
            resolve([[...speakers], speechSegments])
        } catch (err) {
            reject(err)
        }
    })
}

export const prepareAsrXML = (text, captionType = 'SPEECH') => {
    return new Promise((resolve, reject) => {
        if (!captionTypes.hasOwnProperty(captionType))
            reject(new Error('Invalid Caption Type'))
        const { parseNumbers, parseBooleans } = xml2js.processors
        const parser = new xml2js.Parser({
            trim: true,
            preserveChildrenOrder: true,
            attrValueProcessors: [parseNumbers, parseBooleans],
        })
        try {
            parser.parseString(text, async (err, result) => {
                if (err) reject(err)
                const {
                    SegmentList = [],
                    ImageCaptionList = [],
                    SoundCaptionList = [],
                } = result.AudioDoc
                for (let segmentList of SegmentList) {
                    for (let speechSegment of segmentList.SpeechSegment) {
                        for (let word of speechSegment.Word) {
                            for (let attr in word.$) {
                                word[attr] = word.$[attr]
                            }
                            delete word.$
                        }
                    }
                }
                for (let imageCaptionList of ImageCaptionList) {
                    for (let imageSegment of imageCaptionList.ImageSegment) {
                        for (let attr in imageSegment.$) {
                            imageSegment[attr] = imageSegment.$[attr]
                        }
                    }
                }
                for (let soundCaptionList of SoundCaptionList) {
                    for (let soundSegment of soundCaptionList.SoundSegment) {
                        for (let attr in soundSegment.$) {
                            soundSegment[attr] = soundSegment.$[attr]
                        }
                    }
                }
                resolve(await flattenTranscriptObject(result, captionType))
            })
        } catch (err) {
            reject(err)
        }
    })
}

const genTranscriptOrCaptionData = (transcript, type = 'transcript') => {
    // type = 'transcript' | 'image-caption'
    return new Promise(async (resolve) => {
        try {
            // const url = 'transcripts/' + path.match(/[^/]*$/)[0]
            if (_.isUndefined(transcript)) {
                console.log(transcript)
                throw new Error('empty transcript!')
            }

            let azureResourceUrl = transcript['azureResourceUrl']
            let tempResourceUrl = transcript['tempResourceUrl']

            let url = azureResourceUrl || tempResourceUrl

            tempResourceUrl = tempResourceUrl.substring(
                tempResourceUrl.indexOf(`${type}s/`)
            )

            const studioUrl = process.env.REACT_APP_STUDIO_URL
            tempResourceUrl = `${studioUrl}/static/${tempResourceUrl}`

            let data
            if (azureResourceUrl) {
                try {
                    data = await axios.get(azureResourceUrl)
                } catch (err) {
                    console.log('Failed to load azure data!')
                    data = await axios.get(tempResourceUrl)
                }
            } else {
                data = await axios.get(tempResourceUrl)
            }

            if (_.isUndefined(data)) {
                throw new Error(`Cannot get transcript!`)
            }

            const content = data.data

            console.log('CONTENT AA GAYA', content)

            if (data.json) {
                if (url.match(/\.youtube\.json$/i))
                    resolve(await prepareYouTubeTranscript(data.json))
                else resolve(await flattenTranscriptObject(data.json))
            } else {
                if (url.match(/\.srt$/i)) resolve(await prepareSRT(content))
                if (url.match(/\.yt\.vtt$/i))
                    resolve(await prepareYTVTT(content))
                if (url.match(/\.vtt$/i)) resolve(await prepareSRT(content))
                if (url.match(/\.stm$/i)) resolve(await prepareSTM(content))
                if (url.match(/\.textgrid$/i))
                    resolve(await prepareTextGrid(content))
                if (url.match(/\.xml$/i)) resolve(await prepareAsrXML(content))
            }
        } catch (err) {
            resolve([[], [], [], []])
        }
    })
}

const genTranscript = async (
    transcript,
    imageCaption,
    soundCaption,
    recordingId
) => {
    return new Promise(async (resolve, reject) => {
        try {
            let [
                speakers = [],
                speechSegments = [],
                imageSegments = [],
                soundSegments = [],
            ] = await genTranscriptOrCaptionData(transcript)
            imageSegments.push(
                ...(
                    await genTranscriptOrCaptionData(
                        imageCaption,
                        'image-caption'
                    )
                )[2]
            )
            soundSegments.push(
                ...(
                    await genTranscriptOrCaptionData(
                        imageCaption,
                        'image-caption'
                    )
                )[3]
            )
            if (
                speechSegments.length === 0 &&
                imageSegments.length === 0 &&
                soundSegments.length === 0
            ) {
                reject(
                    'This transcript appears to be corrupted or to no longer exist.'
                )
            }
            resolve([
                speakers,
                speechSegments,
                imageSegments,
                soundSegments,
                topWords(
                    [...speechSegments, ...imageSegments, ...soundSegments],
                    15
                ),
            ])
        } catch (err) {
            reject(err)
        }
    })
}

export default genTranscript
