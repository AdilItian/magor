import customStopwords from './customStopwords'
const { english: sw } = require('stopwords')

export default function (speechSegments, top = 10) {
    const map = new Map()
    for (let speechSegment of speechSegments) {
        for (let speechSubSegment of speechSegment.speechSubSegments) {
            for (let w of speechSubSegment.words) {
                const _w = w.toLowerCase().replace(/[^A-z]/g, '')
                if (sw.indexOf(_w) !== -1 || customStopwords.indexOf(_w) !== -1)
                    continue
                map.set(_w, map.has(_w) ? map.get(_w) + 1 : 1)
            }
        }
    }
    return Array.from(map)
        .sort((a, b) => b[1] - a[1])
        .slice(0, top)
}
