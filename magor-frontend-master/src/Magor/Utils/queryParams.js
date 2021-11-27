import captionsQueryBuilder from './captionsQueryBuilder'

export const queryParamNames = {
    TEXT: 'TEXT',
    IMAGE: 'IMAGE',
    SOUND: 'SOUND',
    SPEAKER: 'SPEAKER',
    TAG: 'TAG',
}

export class QueryParams {
    #params = {
        TEXT: null,
        IMAGE: null,
        SOUND: null,
        SPEAKER: null,
        TAG: null,
    }
    constructor(query) {
        if (query) {
            const fields = captionsQueryBuilder(query, true)
            this.#params = {
                ...this.#params,
                ...fields,
            }
        }
    }
    get params() {
        return { ...this.#params }
    }
    setParam(param, value) {
        if (
            !this.#params.hasOwnProperty(param) ||
            !(value === null || typeof value === 'string')
        )
            return false
        this.#params[param] = value
    }
    getParam(param) {
        if (!this.#params.hasOwnProperty(param)) return false
        return this.#params[param]
    }
    get empty() {
        return Object.keys(this.#params).filter((k) => this.#params[k] === null)
    }
    toQueryString() {
        return Object.keys(this.#params)
            .map((k) =>
                this.#params[k] && this.#params[k] !== ''
                    ? k !== queryParamNames.TEXT
                        ? `${k.toLowerCase()}:${this.#params[k]}`
                        : this.#params[k]
                    : ''
            )
            .filter((s) => s.trim() !== '')
            .join(' ')
    }
}
