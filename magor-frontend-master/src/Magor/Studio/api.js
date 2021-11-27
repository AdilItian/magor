import axios from 'axios'
import * as _ from 'lodash'

const studioUrl = process.env.REACT_APP_STUDIO_URL || 'http://localhost:3002'

export const fetchMediaById = (id) => {
    return new Promise(async (resolve, reject) => {
        const { data } = await axios.get(`${studioUrl}/media`, {
            params: { id },
        })
        resolve(data)
    })
}

export const fetchPendingASRRequests = (id) => {
    return new Promise(async (resolve, reject) => {
        const { data } = await axios.get(`${studioUrl}/asr/current`, {
            params: { id },
        })
        resolve(data)
    })
}

export const fetchPendingICRRequests = (id) => {
    return new Promise(async (resolve, reject) => {
        const { data } = await axios.get(`${studioUrl}/icr/current`, {
            params: { id },
        })
        resolve(data)
    })
}

export const deleteMediaById = async (id) => {
    try {
        const token = localStorage.getItem('token')
        await axios.delete(`${studioUrl}/media`, {
            params: { id },
            headers: { authorization: `Bearer ${token}` },
        })
        console.log(`Deleted ${id}!`)
        return true
    } catch (err) {
        throw err
    }
}

export const updateMediaById = (id, updates) => {
    const token = localStorage.getItem('token')
    return new Promise(async (resolve, reject) => {
        try {
            const { data } = await axios.put(
                `${studioUrl}/media`,
                { updates },
                {
                    params: { id },
                    headers: { authorization: `Bearer ${token}` },
                }
            )
            resolve(data)
        } catch ({ response }) {
            if (response) {
                reject(JSON.stringify(response.data))
            }
            reject(`Unknown or Network Connection error.`)
        }
    })
}

export const updateTranscriptById = async (id, name) => {
    const token = localStorage.getItem('token')
    console.log(id, name)
    return new Promise(async (resolve, reject) => {
        try {
            const { data } = await axios.put(
                `${studioUrl}/transcript`,
                { name },
                {
                    params: { id },
                    headers: { authorization: `Bearer ${token}` },
                }
            )
            resolve(data)
        } catch ({ response }) {
            if (response) {
                reject(JSON.stringify(response.data))
            }
            reject(`Unknown or Network Connection error.`)
        }
    })
}

export const deleteTranscriptById = async (id) => {
    try {
        const { data } = await axios.delete(`${studioUrl}/transcript`, {
            params: { id },
        })
        return data
    } catch ({ response }) {
        if (response) {
            throw Error(JSON.stringify(response.data))
        }
        throw Error(`Unknown or Network Connection error.`)
    }
}

export const processAutoTranscribe = (id, metadata) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { data } = await axios.post(
                `${studioUrl}/asr/new`,
                { ...metadata },
                { params: { id } }
            )
            resolve(data)
        } catch (error) {
            const msg = _.get(error.response, 'data', 'Connection Error.')
            reject(msg)
        }
    })
}

export const processAutoImageCaption = (id) => {
    return new Promise(async (resolve, reject) => {
        try {
            const { data } = await axios.post(
                `${studioUrl}/icr/new`,
                {},
                {
                    params: { id },
                }
            )
            resolve(data)
            setTimeout(() => {
                resolve({ success: true })
            }, 1500)
        } catch (error) {
            const msg = _.get(error.response, 'data', 'Connection Error.')
            reject(msg)
        }
    })
}

export const fetchAutoTranscribeStatus = (id, asrId) => {
    return new Promise(async (resolve, reject) => {
        const { data } = await axios.get(`${studioUrl}/asr/status`, {
            params: { media: id, asr: asrId },
        })
        if (data.status === 'processing') {
            reject('Transcription in progress.')
        }
        resolve('Transcription completed and attached to media.')
    })
}

export const fetchICRStatus = (id, icrId) => {
    return new Promise(async (resolve, reject) => {
        const { data } = await axios.get(`${studioUrl}/icr/status`, {
            params: { media: id, icr: icrId },
        })
        if (data.status === 'processing') {
            reject('Image caption in progress.')
        }
        resolve('Image caption completed and attached to media.')
    })
}
