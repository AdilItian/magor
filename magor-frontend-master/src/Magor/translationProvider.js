import dataProvider from '../dataProvider'

export const translate = (q, callback, lang = 'mr') => {
    try {
        console.log({ q, lang });
        if (!q) return
        let tl = lang
        if (tl === 'CN') tl = 'zh-CN'
        dataProvider
            .getCustom('translate', { q, tl })
            .then((d) => {
                if(Array.isArray(q) && !Array.isArray(d.translation)) { // Bug with single array inputs
                    callback([d.translation])
                } else {
                    callback(d.translation)
                }
            })
            .catch((err) => callback(q))
    } catch (err) {
        callback(q)
    }
}

export default translate
