/*
 * STM Syntax: fileName([^ ]*) num([^ ]*) speakerId([^ ]*) startTime(%float) endTime(%float) tags?(<[^ ]*>) text(.*)
 * ie, every line is of the form "fileName num speakerId startTime endTime tags text", where:
 * - fileName is a string of any length with no spaces
 * - num is a string of any length with no spaces
 * - speakerId is a string of any length with no spaces
 * - startTime is the start time in seconds which must be an integer or float
 * - endTime is the start time in seconds which must be an integer or float
 * - tags may not be present, but if it is, it is of the form '<tag1,tag2,...>' where no tag contains spaces
 * - text is any string (may contain spaces) and defaults to '' if empty
 */
import parser from '../stm-parser'

const testGenerator = (
    fileName,
    num,
    speakerId,
    startTime,
    endTime,
    tags,
    transcript
) => {
    return {
        query: `${fileName} ${num} ${speakerId} ${startTime} ${endTime} <${tags.join(
            ','
        )}> ${transcript}`,
        result: {
            fileName,
            num,
            speakerId,
            startTime: Math.floor(startTime * 1000),
            endTime: Math.floor(endTime * 1000),
            tags,
            transcript,
        },
    }
}

test('parser is defined', () => {
    expect(parser).toBeDefined()
})

test('parser must not throw for non-string inputs', () => {
    expect(parser(1234)).toMatchObject([])
})

test('parser parses a valid line correctly', () => {
    const { query, result } = testGenerator(
        'file-name',
        'x',
        'speaker-1',
        0,
        1.75,
        ['a', 'b'],
        'this is the text'
    )
    expect(parser(query)).toEqual([result])
})

test('Block is invalid for non-float startTime or endTime', () => {
    expect(
        parser('file-name x speaker-1 not-a-float 1.75 <a,b> this is the text')
    ).toMatchObject([])
    expect(
        parser('file-name x speaker-1 0 not-a-float <a,b> this is the text')
    ).toMatchObject([])
})

test('Block is invalid without file-name, num or speaker-id', () => {
    expect(parser('x speaker-1 0 1.75 <a,b> this is the text')).toMatchObject(
        []
    )
    expect(parser(' x speaker-1 0 1.75 <a,b> this is the text')).toMatchObject(
        []
    )
    expect(
        parser('file-name speaker-1 0 1.75 <a,b> this is the text')
    ).toMatchObject([])
    expect(
        parser('file-name  speaker-1 0 1.75 <a,b> this is the text')
    ).toMatchObject([])
    expect(parser('file-name x 0 1.75 <a,b> this is the text')).toMatchObject(
        []
    )
    expect(parser('file-name x  0 1.75 <a,b> this is the text')).toMatchObject(
        []
    )
    expect(parser('0 1.75 <a,b> this is the text')).toMatchObject([])
    expect(parser('   0 1.75 <a,b> this is the text')).toMatchObject([])
})

test('Block accepts malformed or missing tags', () => {
    const { result } = testGenerator(
        'file-name',
        'x',
        'speaker-1',
        0,
        1.75,
        ['a', 'b'],
        'this is the text'
    )
    expect(
        parser('file-name x speaker-1 0 1.75 <a,b this is the text')
    ).toMatchObject([
        {
            ...result,
            tags: [],
            transcript: '<a,b this is the text',
        },
    ])
    expect(
        parser('file-name x speaker-1 0 1.75  this is the text')
    ).toMatchObject([
        {
            ...result,
            tags: [],
            transcript: ' this is the text',
        },
    ])
    expect(
        parser('file-name x speaker-1 0 1.75 this is the text')
    ).toMatchObject([
        {
            ...result,
            tags: [],
        },
    ])
})

test('Block without transcript text is invalid', () => {
    expect(parser('file-name x speaker-1 0 1.75 <a,b> ')).toMatchObject([])
    expect(parser('file-name x speaker-1 0 1.75 <a,b>')).toMatchObject([])
})
