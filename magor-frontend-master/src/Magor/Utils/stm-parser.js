import { isEmpty, isFloat } from 'validator'
const parseLine = (line) => {
    const [
        fileName,
        num,
        speakerId,
        startTime,
        endTime,
        tags,
        ...transcript
    ] = line.split(' ')
    let transcriptText = transcript.join(' ')
    let tagsValid = true
    if (isEmpty(fileName, { ignore_whitespace: true })) return null
    if (isEmpty(num, { ignore_whitespace: true })) return null
    if (isEmpty(speakerId, { ignore_whitespace: true })) return null
    if (!isFloat(startTime)) return null
    if (!isFloat(endTime)) return null
    if (!tags.match(/^<.*>$/)) {
        transcriptText = tags + ' ' + transcriptText
        tagsValid = false
    }
    if (isEmpty(transcriptText, { ignore_whitespace: true })) return null
    return {
        fileName,
        num,
        speakerId,
        startTime: Math.floor(parseFloat(startTime) * 1000),
        endTime: Math.floor(parseFloat(endTime) * 1000),
        tags: !tagsValid ? [] : tags.substr(1, tags.length - 2).split(','),
        transcript: transcriptText,
    }
}

export const parse = (text) => {
    if (typeof text !== 'string') return [];

    const lines = text.split('\n')
    const validBlocks = lines.map(parseLine).filter((line) => line != null)
    return validBlocks
}

export default parse
