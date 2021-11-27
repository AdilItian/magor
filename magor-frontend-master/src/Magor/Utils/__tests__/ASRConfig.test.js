import { asrLanguages } from '../ASRConfig'

test('asrLanguages is an array', () => {
    expect(Array.isArray(asrLanguages)).toBe(true)
})

test('All asrLanguages must be of type {key, value}', () => {
    for (let asrLanguage of asrLanguages) {
        // Only objects
        expect(typeof asrLanguage).toBe('object')

        // key and value properties must be strings
        const { key, value } = asrLanguage
        expect(typeof key).toBe('string')
        expect(typeof value).toBe('string')

        // Must have {key, value} and no additional properties
        expect(asrLanguage).toEqual({ key, value })
    }
})
