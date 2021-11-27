import sw from 'stopword'
// import stemmer from 'stemmer';

export default function (tags) {
    if (!Array.isArray(tags)) return null
    const sanitized = tags.map(String)
    const unique = Array.from(new Set(sanitized))
    const withoutStopwords = sw.removeStopwords(unique, sw.en) // remove english stopwords
    return withoutStopwords.filter((word) => word.length > 2)
}
