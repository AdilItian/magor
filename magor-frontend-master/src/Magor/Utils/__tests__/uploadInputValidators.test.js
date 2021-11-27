/* eslint-disable import/first */
const fs = require('fs')
jest.mock('../../../dataProvider')
import {
    titleValidator,
    recordingValidator,
    transcriptValidator,
    captionsValidator,
    captionTypes,
} from '../uploadInputValidators'

const validTranscript = (format, name) => {
    const fileName = name || `valid.${format}`
    const data = fs.readFileSync(`public/test/${fileName}`, {
        encoding: 'UTF-8',
    })
    return {
        name: fileName,
        text: () => Promise.resolve(data),
    }
}

const mockFile = (name, text) => {
    return {
        name,
        text: () => Promise.resolve(text),
    }
}

test('No undefined', () => {
    expect(titleValidator).toBeDefined()
    expect(recordingValidator).toBeDefined()
    expect(transcriptValidator).toBeDefined()
})

test('Title Validator tests', () => {
    expect(titleValidator()).rejects.toHaveProperty('message')
    expect(titleValidator('')).rejects.toHaveProperty('message')
    expect(titleValidator(' ')).rejects.toHaveProperty('message')
    expect(titleValidator('some content')).resolves.toHaveProperty('message')
    expect(titleValidator('', 'MyPrefix: ')).rejects.toHaveProperty(
        'message',
        expect.stringMatching(/^MyPrefix: /)
    )
})

test('Recording Validator tests', () => {
    expect(recordingValidator()).rejects.toHaveProperty('message')
    expect(recordingValidator('')).rejects.toHaveProperty('message')
    expect(recordingValidator('', 'MyPrefix: ')).rejects.toHaveProperty(
        'message',
        expect.stringMatching(/^MyPrefix: /)
    )
    expect(recordingValidator('random.azar69')).rejects.toHaveProperty(
        'message'
    )

    expect(
        recordingValidator({ name: 'recording.mov' })
    ).resolves.toHaveProperty('message')

    expect(
        recordingValidator({ name: 'recording.mp3' })
    ).resolves.toHaveProperty('message')

    expect(
        recordingValidator({ name: 'recording.jpeg' })
    ).rejects.toHaveProperty('message')
})

test('Transcript Validator tests', () => {
    const val = transcriptValidator
    expect(val()).rejects.toHaveProperty('message')
    expect(val('')).rejects.toHaveProperty('message')
    expect(val('', 'MyPrefix: ')).rejects.toHaveProperty(
        'message',
        expect.stringMatching(/^MyPrefix: /)
    )
    expect(val(mockFile('random.jpg', 'random text'))).rejects.toHaveProperty(
        'message'
    )

    expect(val(validTranscript('srt'))).resolves.toHaveProperty('message')
    expect(
        val(mockFile('invalid.srt', 'invalid piece of garbage'))
    ).rejects.toHaveProperty('message')

    expect(val(validTranscript('yt.vtt'))).resolves.toHaveProperty('message')
    expect(val(mockFile('invalid.yt.vtt', undefined))).rejects.toHaveProperty(
        'message'
    )
    expect(
        val(mockFile('invalid.yt.vtt', 'invalid piece of garbage'))
    ).rejects.toHaveProperty('message')

    expect(val(validTranscript('stm'))).resolves.toHaveProperty('message')
    expect(
        val(mockFile('invalid.stm', 'invalid piece of garbage'))
    ).rejects.toHaveProperty('message')

    expect(val(validTranscript('TextGrid'))).resolves.toHaveProperty('message')
    expect(val(validTranscript('empty.TextGrid'))).resolves.toHaveProperty(
        'message'
    )
    expect(val(validTranscript('empty2.TextGrid'))).rejects.toHaveProperty(
        'message'
    )
    expect(
        val(mockFile('invalid.TextGrid', 'invalid piece of garbage'))
    ).rejects.toHaveProperty('message')

    expect(val(validTranscript('xml'))).resolves.toHaveProperty('message')
    expect(
        val(mockFile('invalid.xml', 'invalid piece of garbage'))
    ).rejects.toHaveProperty('message')
    expect(
        captionsValidator(captionTypes.IMAGE)(
            validTranscript(null, 'valid-image-captions.xml')
        )
    ).resolves.toHaveProperty('message')
    expect(
        captionsValidator(captionTypes.SOUND)(
            validTranscript(null, 'valid-sound-captions.xml')
        )
    ).resolves.toHaveProperty('message')
    expect(
        captionsValidator(captionTypes.SOUND)(
            validTranscript(null, 'valid-image-captions.xml')
        )
    ).rejects.toHaveProperty('message')
    expect(
        captionsValidator(captionTypes.IMAGE)(
            validTranscript(null, 'valid-sound-captions.xml')
        )
    ).rejects.toHaveProperty('message')
    expect(captionsValidator('RANDOM')()).rejects.toHaveProperty('message')
    expect(
        captionsValidator('RANDOM')(validTranscript('TextGrid'))
    ).rejects.toHaveProperty('message')

    expect(val(validTranscript('json'))).resolves.toHaveProperty('message')
    expect(
        val(mockFile('invalid.json', 'invalid piece of garbage'))
    ).rejects.toHaveProperty('message')
})
