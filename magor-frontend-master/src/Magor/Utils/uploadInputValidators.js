const srt = require('subtitle')
const textgrid = require('textgrid').TextGrid
const stm = require('./stm-parser')
const ytvtt = require('./ytvtt-parser').default
const mime = require('mime-types')
const { isEmpty } = require('validator')
const {
    flattenTranscriptObject: asrJSONParser,
    prepareAsrXML,
} = require('../transcriptProvider')
export const captionTypes = {
    IMAGE: 'IMAGE',
    SOUND: 'SOUND',
    SPEECH: 'SPEECH',
}

const validateSRT = (data) => {
    const subtitles = srt.parse(data.contents)

    // Consider file to be a Valid SRT as long as there is at least one non-empty subtitle
    for (let subtitle of subtitles) if (subtitle.start) return true
    return false
}

const validateYTVTT = async (data) => {
    return new Promise(async (resolve) => {
        try {
            const subtitles = await ytvtt(data.contents)
            // Consider file to be a Valid VTT as long as there is at least one non-empty subtitle
            if (subtitles.length > 0) resolve(true)
            resolve(false)
        } catch (err) {
            resolve(false)
        }
    })
}

const validateSTM = (data) => {
    const subtitles = stm.parse(data.contents)

    // Only valid subtitles are returned by this function
    if (subtitles.length !== 0) return true
    return false
}

const validateTextgrid = (data) => {
    try {
        const json = textgrid.textgridToJSON(data.contents)
        if (
            json.items
                .map((item) => item.intervals_size)
                .reduce((p, c) => p + c) > 0
        ) {
            return true
        } else {
            return false
        }
    } catch (err) {
        return false
    }
}

const validateAsrJSON = (data) => {
    return new Promise(async (resolve, reject) => {
        try {
            await asrJSONParser(JSON.parse(data.contents))
            resolve(true)
        } catch (err) {
            reject(err)
        }
    })
}

const validateAsrXML = (data, captionType = 'SPEECH') => {
    return new Promise(async (resolve, reject) => {
        try {
            const parsedXML = await prepareAsrXML(data.contents, captionType)
            const imageSegments = parsedXML[2]
            const soundSegments = parsedXML[3]
            if (
                captionType === captionTypes.IMAGE &&
                imageSegments.length === 0
            )
                reject(new Error('Expected at least one Image caption in file'))
            else if (
                captionType === captionTypes.SOUND &&
                soundSegments.length === 0
            )
                reject(new Error('Expected at least one Sound caption in file'))
            resolve(true)
        } catch (err) {
            reject(
                new Error(
                    `Invalid ASR XML ${captionType.toLowerCase()} captions File provided`
                )
            )
        }
    })
}

export const captionsValidator = (captionType) => (file, prefix = '') => {
    return new Promise(async (resolve, reject) => {
        if (!captionTypes.hasOwnProperty(captionType)) {
            reject({
                message: `Invalid validator config - captionType: ${captionType}`,
            })
        }
        if (!file) {
            reject({ message: `${prefix}No file selected` })
        } else {
            // encapsulate text data in object to avoid passing large text by value
            const data = {
                contents: await file.text(),
            }

            let valid = false
            let message

            if (file.name.match(/\.xml$/i)) {
                try {
                    await validateAsrXML(data, captionType)
                    valid = true
                    message =
                        prefix +
                        `Valid ASR XML ${captionType.toLowerCase()} captions file`
                } catch (err) {
                    message = prefix + err.message
                }
            } else {
                message =
                    prefix +
                    `Only valid ASR-XML files with at least one ${captionType.toLowerCase()} caption accepted`
            }

            if (valid) resolve({ message })
            else reject({ message })
        }
    })
}

export const transcriptValidator = (file, prefix = '') => {
    return new Promise(async (resolve, reject) => {
        if (!file) {
            reject({ message: `${prefix}No file selected` })
        } else {
            // encapsulate text data in object to avoid passing large text by value
            const data = {
                contents: await file.text(),
            }

            let valid = false
            let message

            if (file.name.match(/\.yt\.vtt$/i)) {
                if (await validateYTVTT(data)) {
                    valid = true
                }
                message = prefix + `${valid ? 'Valid' : 'Invalid'} YT-VTT file`
            } else if (file.name.match(/\.(srt|vtt)$/i)) {
                if (validateSRT(data)) {
                    valid = true
                }
                message = prefix + `${valid ? 'Valid' : 'Invalid'} SRT/VTT file`
            } else if (file.name.match(/\.stm$/i)) {
                if (validateSTM(data)) {
                    valid = true
                }
                message = prefix + `${valid ? 'Valid' : 'Invalid'} STM file`
            } else if (file.name.match(/\.textgrid$/i)) {
                if (validateTextgrid(data)) {
                    valid = true
                }
                message =
                    prefix + `${valid ? 'Valid' : 'Invalid'} TextGrid file`
            } else if (file.name.match(/\.json$/i)) {
                try {
                    await validateAsrJSON(data)
                    valid = true
                } catch (err) {}
                message =
                    prefix + `${valid ? 'Valid' : 'Invalid'} ASR JSON file`
            } else if (file.name.match(/\.xml$/i)) {
                try {
                    await validateAsrXML(data)
                    valid = true
                } catch (err) {}
                message = prefix + `${valid ? 'Valid' : 'Invalid'} ASR XML file`
            } else {
                message =
                    prefix +
                    'Only valid SRT, VTT, STM, TextGrid, JSON, XML files allowed'
            }

            if (valid) resolve({ message })
            else reject({ message })
        }
    })
}

export const recordingValidator = (file, prefix = '') => {
    return new Promise((resolve, reject) => {
        let valid = false
        let message
        if (file) {
            const mimeType = mime.lookup(file.name)
            if (mimeType) {
                const fileType = mimeType.split('/')[0].toLowerCase()
                if (['audio', 'video'].indexOf(fileType) !== -1) {
                    valid = true
                    message = `${prefix}Valid ${mimeType
                        .split('/')[1]
                        .toUpperCase()} File`
                } else {
                    message = `${prefix}Invalid file type. Only Audio/Video files allowed`
                }
            } else {
                message = `${prefix}Unrecognized file type`
            }
        } else {
            message = `${prefix}No file selected`
        }
        if (valid) resolve({ message })
        else reject({ message })
    })
}

export const titleValidator = (title, prefix = '') => {
    return new Promise((resolve, reject) => {
        let valid = false
        let message
        if (typeof title === 'string') {
            if (!isEmpty(title, { ignore_whitespace: true })) {
                valid = true
                message = 'Valid'
            } else {
                message = `${prefix}Title can't be empty`
            }
        }
        if (valid) resolve({ message })
        else reject({ message })
    })
}
