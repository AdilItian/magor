const path = require('path')
const fs = require('fs').promises
const data = {
    users: [
        {
            _id: 'u0',
            role: 'admin',
            userStatus: 'notVerified',
            name: 'John Doe',
            email: 'john@doe.com',
            password: 'SomeHash',
            createdAt: '2020-04-02T01:48:46.167Z',
            updatedAt: '2020-04-02T01:48:46.167Z',
        },
        {
            _id: 'u1',
            role: 'admin',
            userStatus: 'notVerified',
            name: 'John Doe 2',
            email: 'john2@doe.com',
            password: 'SomeHash2',
            createdAt: '2020-04-02T01:48:46.167Z',
            updatedAt: '2020-04-02T01:48:46.167Z',
        },
    ],
    recordings: [
        {
            _id: 'r0',
            title: 'Closetalk 2',
            description: 'Chinese recording test',
            path: 'public/recordings/m-1585626217546.wav',
            transcripts: [
                {
                    _id: 'tr0',
                    path: 'valid.xml',
                    version: 0,
                    uploaderId: 'u0',
                    uploadDate: '2020-03-31T03:43:38.175Z',
                    name: 'V1',
                },
            ],
            imageCaptions: [
                {
                    _id: 'ic0',
                    path: 'valid-image-captions.xml',
                    version: 0,
                    uploaderId: 'u0',
                    uploadDate: '2020-03-31T03:43:38.175Z',
                    name: 'V1',
                },
            ],
            soundCaptions: [
                {
                    _id: 'sc0',
                    path: 'valid-sound-captions.xml',
                    version: 0,
                    uploaderId: 'u0',
                    uploadDate: '2020-03-31T03:43:38.175Z',
                    name: 'V1',
                },
            ],
            tags: [
                {
                    tagName: 'tagName',
                    source: 'manual',
                    _id: 't0',
                },
            ],
            uploaderId: 'u0',
            uploadDate: '2020-03-31T03:43:38.180Z',
            createdAt: '2020-03-31T03:43:38.203Z',
            updatedAt: '2020-05-11T04:27:01.731Z',
            durationInSeconds: 1212.311,
            thumbnailPath: 'public/images/audio.svg',
            uniqueWordsSpeech: [],
            uniqueWordsImage: [],
            uniqueWordsSound: [],
            speakers: ['Chinmay'],
        },
    ],
}

const findLike = (obj, ref) => {
    if (typeof obj !== 'object' || typeof ref !== 'object') return false
    for (let r in ref) {
        if (obj[r] !== ref[r]) return false
    }
    return true
}

const findText = (obj, text) => {
    if (typeof obj !== 'object' || typeof text !== 'string') return false
    const queryWords = text.split(' ')
    for (let k in obj) {
        for (let q of queryWords) {
            if (String(obj[k]).match(q)) return true
        }
    }
    return false
}

const update = (obj, updates) => {
    for (let k in updates) {
        obj[k] = updates[k]
    }
    return obj
}

export default {
    getCustom: (resource, query) => {
        return new Promise((resolve, reject) => {
            try {
                if (resource === '') {
                    // Login test (GET /)
                    if (localStorage.getItem('loggedOut') === 'true') {
                        resolve(null)
                    } else {
                        const role = localStorage.getItem('role') || 'admin'
                        resolve({
                            ...data.users[0],
                            role,
                        })
                    }
                } else {
                    resolve(data[resource].filter((o) => findLike(o, query)))
                }
            } catch (error) {
                reject({ status: 404, message: 'Not Found', error })
            }
        })
    },
    getOne: (resource, params) => {
        return new Promise((resolve, reject) => {
            try {
                if (localStorage.getItem('loggedOut') === 'true') {
                    reject({ status: 401, message: 'Unauthorised' })
                } else {
                    const one = data[resource].filter(
                        (o) => o._id === params.id
                    )[0]
                    one
                        ? resolve({ data: one })
                        : reject({ status: 404, message: 'Not Found' })
                }
            } catch (error) {
                reject({ status: 422, message: 'Unprocessable Entity', error })
            }
        })
    },
    getList: (resource, params) => {
        return new Promise((resolve, reject) => {
            try {
                resolve({
                    data: data[resource].filter((o) =>
                        findLike(o, params.filter)
                    ),
                })
            } catch (error) {
                reject({ status: 404, message: 'Not Found', error })
            }
        })
    },
    getListTextSearch: (resource, text) => {
        return new Promise((resolve, reject) => {
            try {
                resolve({
                    data: data[resource].filter((o) => findText(o, text)),
                })
            } catch (error) {
                reject({ status: 404, message: 'Not Found', error })
            }
        })
    },
    getStatic: (resource) =>
        fs.readFile(path.join(__dirname, '../../public/test/', resource), {
            encoding: 'utf-8',
        }),
    uploadFile: () => Promise.resolve({ status: 200 }),
    getMany: (resource, params) => {
        return new Promise((resolve, reject) => {
            try {
                resolve({
                    data: data[resource].filter((o) =>
                        findLike(
                            o,
                            params.ids.map((id) => ({ _id: id }))
                        )
                    ),
                })
            } catch (error) {
                reject({ status: 404, message: 'Not Found', error })
            }
        })
    },
    update: (resource, params) => {
        return new Promise((resolve, reject) => {
            try {
                resolve({
                    data: update(
                        data[resource].filter((o) => o.id === params.id)[0],
                        params.data
                    ),
                })
            } catch (error) {
                reject({ status: 400, message: 'Not Found', error })
            }
        })
    },
    create: (resource, params) => {
        return new Promise((resolve, reject) => {
            try {
                data[resource].push({
                    ...params.data,
                    _id: 1 + Math.max(...data[resource].map((r) => r._id)),
                })
                resolve({
                    data: data[resource].filter(
                        (o) => findLike(o, params.data)[0]
                    ),
                })
            } catch (error) {
                reject({ status: 404, message: 'Not Found', error })
            }
        })
    },
    delete: (resource, params) => {
        return new Promise((resolve, reject) => {
            try {
                const index = data[resource].indexOf(
                    data[resource].filter((o) => o._id === params.id)[0]
                )
                if (index === -1) reject({ status: 404, message: 'Not Found' })
                else {
                    data[resource].splice(index, 1)
                    resolve({ data: { status: 200, message: 'deleted' } })
                }
            } catch (error) {
                reject({ status: 404, message: 'Not Found', error })
            }
        })
    },
}
