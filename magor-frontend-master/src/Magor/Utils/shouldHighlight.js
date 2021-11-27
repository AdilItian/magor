export default function (_word, _queryWords) {
    if (typeof _word !== 'string' || !Array.isArray(_queryWords)) return false
    for (let qw of _queryWords) {
        if (typeof qw !== 'string') return false
    }

    let filteredWords = _word
        .replace(/[1234567890`~!@#$%^&*()_\-=+[\]\\{}|;':",./<>?\n]/g, ' ')
        .toLowerCase()
    let filteredQueryWords = _queryWords
        .join(' ')
        .toLowerCase()
        .replace(/[1234567890`~!@#$%^&*()_\-=+[\]\\{}|;':",./<>?\n]/g, '')
        .split(' ')
        .filter((w) => w.match(/[^\s]/))
    let words = filteredWords.split(' ')
    for (let queryWord of filteredQueryWords) {
        for (let word of words) {
            if (
                word === queryWord ||
                (Math.min(word.length, queryWord.length) > 4 &&
                    Math.abs(word.length - queryWord.length) <
                        Math.min(word.length, queryWord.length) &&
                    (word.match(queryWord) || queryWord.match(word)))
            )
                return true
        }
    }
    return false
}
