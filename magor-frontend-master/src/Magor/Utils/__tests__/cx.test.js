import cx from '../cx'

test('CX is not null', () => {
    expect(cx).toBeDefined()
})

test('CX should parse arrays', () => {
    expect(cx(['a', 'b', 'c'])).toBe('a b c')
})

test('CX should parse strings', () => {
    expect(cx('a b c')).toBe('a b c')
})

test('CX should parse objects', () => {
    expect(cx({ a: true, b: false, c: true })).toBe('a c')
    expect(cx({})).toBe('')
})

test("Null/undefined doesn't throw", () => {
    expect(cx(null)).toBe('')
    expect(cx()).toBe('')
    expect(cx(undefined)).toBe('')
})

test("Non-string/object doesn't throw", () => {
    expect(cx(1)).toBe('')
})
