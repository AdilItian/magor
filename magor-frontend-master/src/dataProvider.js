import { fetchUtils } from 'react-admin'
import { stringify } from 'query-string'

const apiUrl = process.env.REACT_APP_APIURL
const studioUrl = process.env.REACT_APP_STUDIO_URL

const httpClient = (url, options = {}) => {
    if (!options.headers)
        options.headers = new Headers({
            Accept: 'application/json',
        })
    const token = localStorage.getItem('token')
    options.headers.set('Authorization', `Bearer ${token}`)
    return fetchUtils.fetchJson(url, options)
}

const fileUploadClient = (url, formData, progressCallback) => {
    const token = localStorage.getItem('token')
    const xhr = new XMLHttpRequest()
    xhr.upload.onprogress = progressCallback
    xhr.open('POST', url)
    xhr.setRequestHeader('Accept', 'application/json')
    xhr.setRequestHeader('Authorization', `Bearer ${token}`)
    xhr.send(formData)
    return xhr
}

export default {
    getCustom: (resource, query) => {
        const url = `${apiUrl}/${resource}?${stringify(query)}`

        return httpClient(url).then(({ headers, json }) => {
            return json
        })
    },
    getList: (resource, params) => {
        const { page, perPage: limit } = params.pagination
        const { field: sort, order } = params.sort
        const query = {
            sort: sort,
            order: order,
            page: page,
            limit: limit,
            //filter not supported yet
            ...(params.filter && params.filter.key && params.filter.fields
                ? {
                      filter: params.filter.key,
                      fields: params.filter.fields.join(','),
                  }
                : {}),
        }
        const url = `${apiUrl}/${resource}?${stringify(query)}`

        return httpClient(url).then(({ headers, json }) => {
            const { docs, ...meta } = json
            return {
                data: docs,
                meta: meta,
                total: meta.totalDocs,
            }
        })
    },
    getListTextSearch: (resource, text, limit, page, sort, order) => {
        const query = {
            filter: JSON.stringify({
                $text: {
                    $search: text || '$',
                    $caseSensitive: false,
                },
            }),
            limit: limit || 5,
            page: page || 1,
            sort: sort,
            order: order,
        }
        const url = `${apiUrl}/${resource}?${stringify(query)}`

        return httpClient(url).then(({ headers, json }) => {
            const { docs, ...meta } = json
            return {
                data: docs,
                meta: meta,
                total: meta.totalDocs,
            }
        })
    },
    getResultsByCaptions: (
        resource,
        _text,
        limit,
        page,
        sort,
        order,
        fields
    ) => {
        const getFieldRegex = (field, text) => ({
            [field]: {
                $regex: `(${text.trim().split(' ').join('|')})`,
                $options: 'i',
            },
        })
        const query = {
            filter: JSON.stringify({
                $or: Object.keys(fields).map((f) =>
                    getFieldRegex(f, fields[f])
                ),
            }),
            limit: limit || 5,
            page: page || 1,
            sort: sort,
            order: order,
        }
        const url = `${apiUrl}/${resource}?${stringify(query)}`

        return httpClient(url).then(({ headers, json }) => {
            const { docs, ...meta } = json
            return {
                data: docs,
                meta: meta,
                total: meta.totalDocs,
            }
        })
    },

    getOne: (resource, params) =>
        httpClient(`${apiUrl}/${resource}/${params.id}`).then(({ json }) => ({
            data: json,
        })),

    getStatic: (resource) => httpClient(`${apiUrl}/static/${resource}`),

    getMany: (resource, params) => {
        const query = {
            filter: JSON.stringify({ _id: params.ids }),
        }
        const url = `${apiUrl}/${resource}?${stringify(query)}`
        return httpClient(url).then(({ headers, json }) => {
            const { docs, ...meta } = json
            return {
                data: docs,
                meta: meta,
                total: meta.totalDocs,
            }
        })
    },

    //getManyReference not supported yet
    getManyReference: (resource, params) => {
        const { page, perPage } = params.pagination
        const { field, order } = params.sort
        const query = {
            sort: JSON.stringify([field, order]),
            range: JSON.stringify([(page - 1) * perPage, page * perPage - 1]),
            filter: JSON.stringify({
                ...params.filter,
                [params.target]: params.id,
            }),
        }
        const url = `${apiUrl}/${resource}?${stringify(query)}`

        return httpClient(url).then(({ headers, json }) => ({
            data: json,
            total: parseInt(headers.get('content-range').split('/').pop(), 10),
        }))
    },

    update: (resource, params) => {
        return httpClient(`${apiUrl}/${resource}/${params.id}`, {
            method: 'PATCH',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({ data: json }))
    },

    // updateMany not supported yet
    updateMany: (resource, params) => {
        const query = {
            filter: JSON.stringify({ id: params.ids }),
        }
        return httpClient(`${apiUrl}/${resource}?${stringify(query)}`, {
            method: 'PATCH',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({ data: json }))
    },

    create: (resource, params) => {
        return httpClient(`${apiUrl}/${resource}`, {
            method: 'POST',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({
            data: json,
        }))
    },

    delete: (resource, params) =>
        httpClient(`${apiUrl}/${resource}/${params.id}`, {
            method: 'DELETE',
        }).then(({ json }) => ({ data: json })),

    //delete many not supported
    deleteMany: (resource, params) => {
        const query = {
            filter: JSON.stringify({ id: params.ids }),
        }
        return httpClient(`${apiUrl}/${resource}?${stringify(query)}`, {
            method: 'DELETE',
            body: JSON.stringify(params.data),
        }).then(({ json }) => ({ data: json }))
    },

    uploadFile: (path, field, file, mediaID, progressCallback = () => {}) => {
        const data = new FormData()
        data.append(field, file, file.name)
        console.log(`${studioUrl}/${path}`);
        return fileUploadClient(`${studioUrl}/${path}`, data, progressCallback)
    },
}
