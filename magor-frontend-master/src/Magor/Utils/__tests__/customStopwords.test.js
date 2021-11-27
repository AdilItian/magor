import customStopwords from '../customStopwords'

test('customStopwords is an array', () => {
    expect(Array.isArray(customStopwords)).toBe(true)
})

test('All customStopwords are strings; No duplicates', () => {
    const count = new Map()
    for (let customStopword of customStopwords) {
        // Only strings
        expect(typeof customStopword).toBe('string')

        // No Duplicate Entries
        expect(count.has(customStopword)).toBe(false)
        count.set(customStopword, 1)
    }
})

test('Custom stopwords must be in alphabetical order', () => {
    expect([...customStopwords].sort()).toEqual(customStopwords)
})
