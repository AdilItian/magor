import { QueryParams, queryParamNames } from '../queryParams'

test('All defined', () => {
    expect(typeof QueryParams).toBe('function')
    expect(typeof queryParamNames).toBe('object')
})

test('All queryParamNames are strings', () => {
    Object.values(queryParamNames).forEach((v) =>
        expect(typeof v).toBe('string')
    )
})

test('Basic tests', () => {
    const qp = new QueryParams()
    const totalParamNamesLength = Object.keys(queryParamNames).length
    const someQueryParamName = queryParamNames[Object.keys(queryParamNames)[0]]

    // all initial values must be null
    Object.values(qp.params).forEach((v) => expect(v).toBeNull())

    // test if a value can be set
    qp.setParam(someQueryParamName, 'someValue')
    expect(qp.getParam(someQueryParamName)).toBe('someValue')

    // expect all others to still be null
    expect(qp.empty).toHaveLength(totalParamNamesLength - 1)

    // test if a value can be unset
    qp.setParam(someQueryParamName, null)
    expect(qp.getParam(someQueryParamName)).toBeNull()
})

test('Test invalid inputs to methods', () => {
    const qp = new QueryParams()
    const someQueryParamName = queryParamNames[Object.keys(queryParamNames)[0]]

    // invalid inputs to setParam
    expect(qp.setParam('RANDOM', 'something')).toBe(false)
    expect(qp.setParam(someQueryParamName, 1234)).toBe(false)

    // invalid input to getParam
    expect(qp.getParam('RANDOM')).toBe(false)
})

test('Test query string and constructor', () => {
    const qp = new QueryParams('Text image:ImageCaption speaker:Speaker')
    const totalParamNamesLength = Object.keys(queryParamNames).length

    expect(qp.getParam(queryParamNames.TEXT)).toBe('Text')
    expect(qp.getParam(queryParamNames.IMAGE)).toBe('ImageCaption')
    expect(qp.getParam(queryParamNames.SPEAKER)).toBe('Speaker')
    expect(qp.empty).toHaveLength(totalParamNamesLength - 3)

    qp.setParam(queryParamNames.SOUND, '')
    expect(qp.toQueryString()).toBe('Text image:ImageCaption speaker:Speaker')
})
