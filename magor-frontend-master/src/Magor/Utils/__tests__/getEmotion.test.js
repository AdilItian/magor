import getEmotion, { emotions } from '../getEmotion'

test('getEmotion and emotions are defined', () => {
    expect(typeof getEmotion).toBe('function')
    expect(typeof emotions).toBe('object')
})

test('every emotion must be of type {name, emoji, color}', () => {
    for (let emotion of Object.keys(emotions).map((e) => emotions[e])) {
        expect(Object.keys(emotion).sort()).toEqual(['color', 'emoji', 'name'])
        Object.values(emotion).forEach((v) => expect(typeof v).toBe('string'))
    }
})

test('Test basic emotions - Anger, Happiness, Sadness, Love', () => {
    expect(getEmotion('ANGER').name).toBe('Anger')
    expect(getEmotion('HAPPINESS').name).toBe('Happiness')
    expect(getEmotion('SADNESS').name).toBe('Sadness')
    expect(getEmotion('LOVE').name).toBe('Love')
})

test('Fallback emotion', () => {
    expect(getEmotion('RANDOM').name).toBe('Unknown')
})
