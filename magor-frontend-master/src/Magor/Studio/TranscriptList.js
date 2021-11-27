import React from 'react'
import * as _ from 'lodash'

import toast from 'react-hot-toast'

import { defaultKeys } from './constants'

import {
    updateTranscriptById,
    updateMediaById,
    deleteTranscriptById,
} from './api'

import { Alert } from 'react-bootstrap'

import TranscriptItem from './TranscriptItem'

export default (props) => {
    let { id, type, mediaData: originalMediaData, refreshMediaData } = props
    let transcripts = _.get(originalMediaData, `_${type}s`, [])
    _.reverse(transcripts)

    console.log('transcripts', transcripts)

    if (transcripts.length === 0) {
        return (
            <Alert variant="info">
                No transcripts found. Upload one or use AutoTranscribe to
                generate a transcript automatically!
            </Alert>
        )
    }

    const handleUpdateTranscript = async (transcriptId, name) => {
        try {
            toast
                .promise(updateTranscriptById(transcriptId, name), {
                    loading: `Update transcript: ${id} name to ${name}!`,
                    success: `Successfully set transcript name to ${name}`,
                    error: (err) => `Error: ${err}`,
                })
                .then((result) => {
                    console.log(result)
                    refreshMediaData()
                })
        } catch (e) {
            console.error(e)
        }
    }

    const setDefaultTranscript = async (type, id) => {
        const mediaId = _.get(originalMediaData, '_id', null)
        const transcriptId = id
        let updates = {}
        updates[defaultKeys[type]] = transcriptId
        try {
            toast
                .promise(updateMediaById(mediaId, updates), {
                    loading: `Setting transcript: ${id} as default!`,
                    success: `Successfully set transcript: ${id} as default!`,
                    error: (err) => `Error: ${err}`,
                })
                .then((result) => {
                    console.log(result)
                    refreshMediaData()
                })
        } catch (e) {
            console.error(e)
        }
    }

    const setDeleteTranscript = async (id) => {
        try {
            toast
                .promise(
                    deleteTranscriptById(id),
                    {
                        loading: `Delete Transcript: ${id}`,
                        success: `Successfully deleted transcript: ${id}!`,
                        error: (err) => `Error: ${err}`,
                    },
                    {
                        success: {
                            icon: '🗑',
                        },
                    }
                )
                .then((result) => {
                    console.log(result)
                    refreshMediaData()
                })
        } catch (err) {
            console.error(err)
        }
    }

    return transcripts.map((transcript) => (
        <TranscriptItem
            transcript={transcript}
            type={type}
            media={originalMediaData}
            setDefaultTranscript={setDefaultTranscript}
            setDeleteTranscript={setDeleteTranscript}
            handleUpdateTranscript={handleUpdateTranscript}
        />
    ))
}
