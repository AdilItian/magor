import React from 'react'

import { Form, Button, Alert, ListGroup } from 'react-bootstrap'

import toast from 'react-hot-toast'

import { fetchAutoTranscribeStatus } from '../api'

import UploadBar from '../UploadBar'

import TranscriptList from '../TranscriptList'

export default (props) => {
    const {
        handleAutoTranscribe,
        refreshMediaData,
        id,
        pendingASRs,
        mediaData,
    } = props

    const renderCurrentJobs = () => {
        if (pendingASRs.length === 0) {
            return <Alert variant="dark">No jobs running currently.</Alert>
        }

        return (
            <ListGroup>
                {pendingASRs.map((asr) => (
                    <ListGroup.Item key={asr['_id']}>
                        <div>{JSON.stringify(asr)}</div>
                        <div className="mt-3">
                            <Button
                                variant="outline-secondary"
                                type="button"
                                size="sm"
                                onClick={() => {
                                    handleRefreshAutoTranscribe(asr['asrId'])
                                }}
                            >
                                Refresh
                            </Button>
                        </div>
                    </ListGroup.Item>
                ))}
            </ListGroup>
        )
    }

    const handleRefreshAutoTranscribe = async (asrId) => {
        toast
            .promise(
                fetchAutoTranscribeStatus(id, asrId),
                {
                    loading: `Checking status for ASR Request: ${asrId}`,
                    success: (data) => `${data}`,
                    error: (err) => `${err}`,
                },
                {
                    error: {
                        duration: 3000,
                        icon: '🕑',
                    },
                }
            )
            .then((data) => {
                console.log(data)
                refreshMediaData()
            })
    }

    return (
        <div className="px-2 py-4 d-flex flex-column">
            <div>
                <h3>Auto Transcribe</h3>
                <h5 className="mt-4">Current Running Jobs</h5>
                <div>{renderCurrentJobs()}</div>
                <h5 className="mt-3">Send a new transcription job</h5>
                <div className="mt-3 p-4 border rounded-3 d-flex flex-column">
                    <Form onSubmit={handleAutoTranscribe}>
                        <Form.Group controlId="languageSelect">
                            <Form.Label>Language</Form.Label>
                            <Form.Control as="select" name="language" custom>
                                <option value="english">English</option>
                                <option value="mandarin">Mandarin</option>
                                <option value="malay">Malay</option>
                                <option value="english-mandarin">
                                    English Mandarin
                                </option>
                                <option value="english-malay">
                                    English Malay
                                </option>
                            </Form.Control>
                        </Form.Group>
                        <Form.Group controlId="audioTypeSelect">
                            <Form.Label>Audio Type</Form.Label>
                            <Form.Control as="select" name="audioType" custom>
                                <option value="closetalk">Close Talk</option>
                                <option value="telephony">Telephony</option>
                            </Form.Control>
                        </Form.Group>
                        <Form.Group controlId="audioTrackSelect">
                            <Form.Label>Audio Track</Form.Label>
                            <Form.Control as="select" name="audioTrack" custom>
                                <option value="single">Single Channel</option>
                                <option value="multi">Multi Channel</option>
                            </Form.Control>
                        </Form.Group>
                        <Button variant="primary" type="submit">
                            Submit
                        </Button>
                    </Form>
                </div>
            </div>
            <div className="mt-4">
                <h3 className="mb-4">Upload Transcript</h3>
                <UploadBar
                    actionDialogue="Select Transcript"
                    mediaId={id}
                    uploadUrl="upload/transcript"
                    transcriptType="transcript"
                    onSuccess={refreshMediaData}
                />
            </div>
            <div className="mt-4">
                <h4>Transcripts</h4>
                <div>
                    <TranscriptList
                        id={id}
                        type="transcript"
                        mediaData={mediaData}
                        refreshMediaData={refreshMediaData}
                    />
                </div>
            </div>
        </div>
    )
}
