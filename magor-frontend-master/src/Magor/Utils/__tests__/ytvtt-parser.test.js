import parser from '../ytvtt-parser'

test('Parser should be defined', () => {
    expect(parser).toBeDefined()
})

it('Parser rejects on null input', () => {
    return expect(parser(null)).rejects.toBeDefined();
})

it('Parser rejects on undefined input', () => {
    return expect(parser(undefined)).rejects.toBeDefined();
})

it('Parser rejects on non-string(obj) input', () => {
    return expect(parser({})).rejects.toBeDefined();
})

it('Parser rejects on non-string(num) input', () => {
    return expect(parser(1234)).rejects.toBeDefined();
})

it('Parser resolves valid input', () => {
    return expect(parser(`
WEBVTT
Kind: captions
Language: en

00:00:00.000 --> 00:00:00.150
Ignored Line
Actual CC
`)).resolves.toEqual([{
        sTimeMs: 0,
        eTimeMs: 150,
        text: 'Actual CC',
    }])
})

it('Parser resolves valid input without header', () => {
    return expect(parser(`
00:00:00.000 --> 00:00:00.150
Ignored Line
Actual CC
`)).resolves.toEqual([{
        sTimeMs: 0,
        eTimeMs: 150,
        text: 'Actual CC',
    }])
})

it('Parser resolves input with european timestamps', () => {
    return expect(parser(`
00:00:00,000 --> 00:00:00,150
Ignored Line
Actual CC
`)).resolves.toEqual([{
        sTimeMs: 0,
        eTimeMs: 150,
        text: 'Actual CC',
    }])
})

it('Parser resolves input with incomplete timestamps', () => {
    return expect(parser(`
00:00:00,00 --> 00:00:00,15
Ignored Line
Actual CC
`)).resolves.toEqual([{
        sTimeMs: 0,
        eTimeMs: 15,
        text: 'Actual CC',
    }])
})

it('Parser resolves input with incomplete timestamps', () => {
    return expect(parser(`
00:00:00,0 --> 00:00:00,5
Ignored Line
Actual CC
`)).resolves.toEqual([{
        sTimeMs: 0,
        eTimeMs: 5,
        text: 'Actual CC',
    }])
})

it('Parser resolves input with multiple captions', () => {
    return expect(parser(`
00:00:00,0 --> 00:00:00,5
Ignored Line
Actual CC

00:00:01,0 --> 00:00:01,5
Ignored Line
Actual CC 2
`)).resolves.toEqual([
    {
        sTimeMs: 0,
        eTimeMs: 5,
        text: 'Actual CC',
    },
    {
        sTimeMs: 1000,
        eTimeMs: 1005,
        text: 'Actual CC 2',
    },
])
})

it('Parser resolves input timestamps correctly', () => {
    return expect(parser(`
03:33:27.368 --> 04:22:19,52
Ignored Line
Actual CC
`)).resolves.toEqual([{
        sTimeMs: ((3 * 60 + 33) * 60 + 27) * 1000 + 368,
        eTimeMs: ((4 * 60 + 22) * 60 + 19) * 1000 + 52,
        text: 'Actual CC',
    }])
})

it('Parser should not recognize empty CC', () => {
    return expect(parser(`
03:33:27.368 --> 04:22:19,52
Empty cc \\/

`)).resolves.toEqual([])
})