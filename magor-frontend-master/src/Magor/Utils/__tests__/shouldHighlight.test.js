import shouldHighlight from '../shouldHighlight'

test('shouldHighlight should be defined', () => {
    expect(shouldHighlight).toBeDefined()
})

test('shouldHighlight shouldn\'t throw for null/non-string params', () => {
    expect(shouldHighlight(100, ['words'])).toBe(false)
    expect(shouldHighlight('word', 100)).toBe(false)
    expect(shouldHighlight(null, ['words'])).toBe(false)
    expect(shouldHighlight(null, [1234])).toBe(false)
    expect(shouldHighlight('word', [1234])).toBe(false)
    expect(shouldHighlight('word', null)).toBe(false)
})

test('shouldHighlight should highlight matched word', () => {
    expect(shouldHighlight('testword', ['testword'])).toBe(true)
})

test('shouldHighlight should ignore case', () => {
    expect(shouldHighlight('teStwoRd', ['tEstWord'])).toBe(true)
})

test('shouldHighlight should ignore symbols', () => {
    expect(
        shouldHighlight('testword`~!@#$%^&*()-=_+ {}|[]\\;\':" ,./<>?', [
            'testword',
        ])
    ).toBe(true)
})

test('shouldHighlight should treat symbols in word as word-breaks', () => {
    expect(
        shouldHighlight(
            'testword`~!@#$%^&*()-=_+{}|[]\\;\':",./<>?othertestword',
            ['testword']
        )
    ).toBe(true)
    expect(
        shouldHighlight(
            'testword`~!@#$%^&*()-=_+{}|[]\\;\':",./<>?othertestword',
            ['othertestword']
        )
    ).toBe(true)
})

test('shouldHighlight should treat newlines in word as word-breaks', () => {
    expect(shouldHighlight('testword\nothertestword', ['testword'])).toBe(true)
    expect(shouldHighlight('testword\nothertestword', ['othertestword'])).toBe(
        true
    )
})

test('shouldHighlight should IGNORE symbols and newlines in queryWords', () => {
    expect(shouldHighlight('testword', ['test\nword'])).toBe(true)
    expect(shouldHighlight('testword', ['test`~1234567890!@#$%^&*()-=_+[]\\{}|;:"\',./<>?word'])).toBe(true)
})

test('shouldHighlight should match subwords if both word lengths > 4 and excluded letters < min word length', () => {
    expect(shouldHighlight('words', ['wordss'])).toBe(true)
    expect(shouldHighlight('word', ['words'])).toBe(false)
    expect(shouldHighlight('words', ['wordsworthing'])).toBe(false)
    expect(shouldHighlight('words', ['or'])).toBe(false)
})