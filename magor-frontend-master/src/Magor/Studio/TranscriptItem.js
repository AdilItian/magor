import React, { useEffect, useState } from 'react'
import * as _ from 'lodash'
import moment from 'moment'

import { Container, Form, Button } from 'react-bootstrap'

import { AsyncSpinner } from '../Components'

const toAgo = (timestamp) => moment(timestamp).fromNow().toString()

const defaultKeys = {
    transcript: '_defaultTranscript',
    imageCaption: '_defaultImageCaption',
    soundCaption: '_defaultSoundCaption',
}

export default (props) => {
    let type = _.get(props, 'type')
    if (_.isUndefined(type))
        throw Error(`Invalid type ${type} supplied to TranscriptItem.`)
    let transcript = _.get(props, 'transcript')
    if (_.isUndefined(transcript))
        throw Error(`Transcript not supplied to TranscriptItem.`)
    let media = _.get(props, 'media')
    if (_.isUndefined(media))
        throw Error(`Media not supplied to TranscriptItem.`)
    let setDefaultTranscript = _.get(props, 'setDefaultTranscript')
    if (_.isUndefined(media) || !_.isFunction(setDefaultTranscript))
        throw Error(`setDefaultTranscript not supplied to TranscriptItem.`)
    let setDeleteTranscript = _.get(props, 'setDeleteTranscript')
    if (_.isUndefined(media) || !_.isFunction(setDeleteTranscript))
        throw Error(`setDeleteTranscript not supplied to TranscriptItem.`)
    let handleUpdateTranscript = _.get(props, 'handleUpdateTranscript')
    if (_.isUndefined(media) || !_.isFunction(handleUpdateTranscript))
        throw Error(`handleUpdateTranscript not supplied to TranscriptItem.`)

    let id = _.get(transcript, '_id', '-')
    let createdAt = _.get(transcript, 'createdAt', '-')
    let updatedAt = _.get(transcript, 'updatedAt', '-')
    let isAutoGenerated = _.get(transcript, 'isAutoGenerated', false)
    let isDefaultTranscript = _.get(media, defaultKeys[type], null) === id
    let name = _.get(transcript, 'name', '')
    let [inputName, setInputName] = useState(name)

    useEffect(() => {
        let name = _.get(transcript, 'name', '')
        setInputName(name)
    }, [transcript])

    return (
        <div className="mt-3" key={id}>
            <Container style={{ maxWidth: '1490px' }} className="border p-4">
                <div className="d-flex justify-content-between">
                    <Form className="d-flex align-items-center">
                        <Form.Group className="d-flex align-items-center mr-3">
                            <Form.Label className="mb-0 mr-2">Name:</Form.Label>
                            <Form.Control
                                type="text"
                                onChange={(e) => {
                                    console.log(e.target.value)
                                    setInputName(e.target.value)
                                }}
                                value={inputName}
                            ></Form.Control>
                        </Form.Group>
                        <Form.Group>
                            <Button
                                variant="outline-dark"
                                onClick={() =>
                                    handleUpdateTranscript(id, inputName)
                                }
                            >
                                Save
                            </Button>
                        </Form.Group>
                    </Form>
                </div>
                <div className="d-flex justify-content-between">
                    <p>Transcript ID: {id}</p>
                    <p>Created At: {toAgo(createdAt)}</p>
                    <p>Last Updated At: {toAgo(updatedAt)}</p>
                </div>
                <div className="d-flex">
                    <p>{isAutoGenerated ? 'Auto Generated' : 'Uploaded'}</p>
                </div>
                <div className="mt-2">
                    <AsyncSpinner
                        type="button"
                        variant={
                            isDefaultTranscript
                                ? 'outline-secondary'
                                : 'outline-success'
                        }
                        disabled={isDefaultTranscript}
                        onClick={() => setDefaultTranscript(type, id)}
                        value={isDefaultTranscript ? 'Default' : 'Set Default'}
                    ></AsyncSpinner>
                    <AsyncSpinner
                        type="button"
                        variant="danger"
                        className="ml-2"
                        onClick={() => setDeleteTranscript(id)}
                        value="Delete"
                    ></AsyncSpinner>
                </div>
            </Container>
        </div>
    )
}
