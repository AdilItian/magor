import topWords from '../topWords'

const getSpeechSegments = (segments) => {
    const speechSegments = []
    for (let segment of segments) {
        const speechSegment = { speechSubSegments: [] }
        for (let sentence of segment) {
            speechSegment.speechSubSegments.push({
                words: sentence.split(' '),
            })
        }
        speechSegments.push(speechSegment)
    }
    return speechSegments
}

test('topWords is a function', () => {
    expect(typeof topWords).toBe('function')
})

test('single segment with single subsegment', () => {
    const speechSegments = getSpeechSegments([
        ['animal animal animal book book cat'],
    ])
    expect(topWords(speechSegments, 3)).toEqual([
        ['animal', 3],
        ['book', 2],
        ['cat', 1],
    ])
    expect(topWords(speechSegments, 2)).toEqual([
        ['animal', 3],
        ['book', 2],
    ])
})

test('that the default top words returned are 10', () => {
    const speechSegments = getSpeechSegments([
        [
            'animal animal bat cat mat sat fat dat chinmay NTU developer javascript',
        ],
    ])
    const top = topWords(speechSegments)
    expect(top.length).toBe(10)
    expect(top.slice(0, 1)).toEqual([['animal', 2]])
})

test('that stopwords are ignored', () => {
    const speechSegments = getSpeechSegments([
        ['animal animal a a a an an an the the the of of of of'],
    ])
    expect(topWords(speechSegments, 1)).toEqual([['animal', 2]])
})

test('that customStopwords are ignored', () => {
    const speechSegments = getSpeechSegments([
        ['animal animal lah lah lah lah'],
    ])
    expect(topWords(speechSegments, 1)).toEqual([['animal', 2]])
})
