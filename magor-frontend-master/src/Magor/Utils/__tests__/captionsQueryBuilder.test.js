import build from '../captionsQueryBuilder'

test('build is defined', () => {
    expect(typeof build).toBe('function')
})

test('plain text', () => {
    const text = 'plain text'

    // Method Mode
    expect(build(text)).toEqual({
        method: 'getListTextSearch',
        text,
        fields: undefined,
    })

    // Pure Object Mode
    expect(build(text, true)).toEqual({
        TEXT: text,
    })
})

test('image captions', () => {
    // Method Mode
    expect(build('image: caption')).toEqual({
        method: 'getResultsByCaptions',
        text: undefined,
        fields: { uniqueWordsImage: 'caption' },
    })

    // Pure Object Mode
    expect(build('image: caption', true)).toEqual({
        TEXT: undefined,
        IMAGE: 'caption',
    })
})

test('sound caption', () => {
    // Method Mode
    expect(build('sound: caption')).toEqual({
        method: 'getResultsByCaptions',
        text: undefined,
        fields: { uniqueWordsSound: 'caption' },
    })

    // Pure Object Mode
    expect(build('sound: caption', true)).toEqual({
        TEXT: undefined,
        SOUND: 'caption',
    })
})

test('speaker', () => {
    // Method Mode
    expect(build('speaker: SPKR')).toEqual({
        method: 'getResultsByCaptions',
        text: undefined,
        fields: { speakers: 'SPKR' },
    })

    // Pure Object Mode
    expect(build('speaker: SPKR', true)).toEqual({
        TEXT: undefined,
        SPEAKER: 'SPKR',
    })
})

test('tag', () => {
    // Method Mode
    expect(build('tag: T')).toEqual({
        method: 'getResultsByCaptions',
        text: undefined,
        fields: { 'tags.tagName': 'T' },
    })

    // Pure Object Mode
    expect(build('tag: T', true)).toEqual({
        TEXT: undefined,
        TAG: 'T',
    })
})

test('emotion', () => {
    // Method Mode
    expect(build('emotion: E')).toEqual({
        method: 'getResultsByCaptions',
        text: undefined,
        fields: { emotion: 'E' },
    })

    // Pure Object Mode
    expect(build('emotion: E', true)).toEqual({
        TEXT: undefined,
        EMOTION: 'E',
    })
})

test('multiple', () => {
    // Method Mode
    expect(build('text image:i sound: s tag:t speaker:S emotion:E')).toEqual({
        method: 'getResultsByCaptions',
        text: undefined,
        fields: {
            uniqueWordsSpeech: 'text',
            uniqueWordsImage: 'i',
            uniqueWordsSound: 's',
            'tags.tagName': 't',
            speakers: 'S',
            emotion: 'E',
        },
    })

    // Pure Object Mode
    expect(
        build('text image:i sound: s tag:t speaker:S emotion:E', true)
    ).toEqual({
        TEXT: 'text',
        IMAGE: 'i',
        SOUND: 's',
        TAG: 't',
        SPEAKER: 'S',
        EMOTION: 'E',
    })
})

test('duplicate', () => {
    // Method Mode
    expect(build('text image:i image:i2')).toEqual({
        method: 'getResultsByCaptions',
        text: undefined,
        fields: {
            uniqueWordsSpeech: 'text',
            uniqueWordsImage: 'i i2',
        },
    })

    // Pure Object Mode
    expect(build('text image:i image:i2', true)).toEqual({
        TEXT: 'text',
        IMAGE: 'i i2',
    })
})
