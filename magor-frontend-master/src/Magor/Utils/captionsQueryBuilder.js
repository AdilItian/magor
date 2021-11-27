const queryField = {
    image: 'uniqueWordsImage',
    sound: 'uniqueWordsSound',
    speaker: 'speakers',
    tag: 'tags.tagName',
    emotion: 'emotion',
}
const build = (queryString, getPureObject = false) => {
    let method
    let text
    let fields
    if (!queryString.match(/(image|sound|speaker|tag|emotion):/g)) {
        method = 'getListTextSearch'
        text = queryString
    } else {
        let match
        let q = queryString
        method = 'getResultsByCaptions'
        fields = {}
        while (
            (match = q.match(
                /(image|sound|speaker|tag|emotion):((?:(?!image:|sound:|speaker:|tag:|emotion:).)*)/
            )) != null
        ) {
            // eslint-disable-next-line no-unused-vars
            const [_, field, text] = match
            let f = queryField[field]
            if (getPureObject) f = field.toUpperCase()
            if (!fields[f]) fields[f] = ''
            fields[f] = (fields[f] + ' ' + text).trim()
            q = q.replace(
                /(image|sound|speaker|tag|emotion):((?:(?!image:|sound:|speaker:|tag:|emotion:).)*)/,
                ''
            )
        }
        if (q.trim() !== '') {
            if (getPureObject) fields.TEXT = q.trim()
            else fields.uniqueWordsSpeech = q.trim()
        }
    }
    if (!getPureObject) return { method, text, fields }
    else return { TEXT: text, ...(fields || {}) }
}

export default build
