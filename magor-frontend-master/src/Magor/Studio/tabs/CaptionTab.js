import React from 'react'

import { Form, Button, ListGroup, Alert } from 'react-bootstrap'

import toast from 'react-hot-toast'

import { processAutoImageCaption, fetchICRStatus } from '../api'

import UploadBar from '../UploadBar'
import TranscriptList from '../TranscriptList'

export default (props) => {
    const { id, mediaData, refreshMediaData, pendingICRs = [] } = props

    const handleRefreshAutoIC = async (icrId) => {
        toast
            .promise(
                fetchICRStatus(id, icrId),
                {
                    loading: `Checking status for IC Request: ${icrId}`,
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

    const renderCurrentJobs = () => {
        if (pendingICRs.length === 0) {
            return <Alert variant="dark">No jobs running currently.</Alert>
        }

        return (
            <ListGroup>
                {pendingICRs.map((icr) => (
                    <ListGroup.Item key={icr['_id']}>
                        <div>{JSON.stringify(icr)}</div>
                        <div className="mt-3">
                            <Button
                                variant="outline-secondary"
                                type="button"
                                size="sm"
                                onClick={() => {
                                    handleRefreshAutoIC(icr['icrId'])
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

    const handleAutoImageCaption = async (e) => {
        e.preventDefault()
        toast
            .promise(processAutoImageCaption(id), {
                loading: 'Uploading media for image captions',
                success: 'Successfully started a new job!',
                error: (err) => `Error: ${err}`,
            })
            .then((data) => {
                console.log(data)
                refreshMediaData()
            })
    }

    return (
        <div className="px-2 py-4 d-flex flex-column">
            <div>
                <h4>Image Captions</h4>
                <h5 className="mt-4">Current Running Jobs</h5>
                <div>{renderCurrentJobs()}</div>
                <h5 className="mt-4">Send a new image caption job</h5>
                <div className="mt-3 p-4 border rounded-3 d-flex flex-column">
                    <Form onSubmit={handleAutoImageCaption}>
                        <Button variant="primary" type="submit">
                            Submit
                        </Button>
                    </Form>
                </div>
                <div className="mt-4">
                    <h5 className="mb-4">Upload Image Caption</h5>
                    <UploadBar
                        actionDialogue="Select Image Caption"
                        mediaId={id}
                        uploadUrl="upload/transcript"
                        transcriptType="imageCaption"
                    />
                    <div className="mt-3">
                        <div>
                            <TranscriptList
                                id={id}
                                type="imageCaption"
                                mediaData={mediaData}
                                refreshMediaData={refreshMediaData}
                            />
                        </div>
                    </div>
                </div>
            </div>
            <div className="my-3">
                <h4>Sound Captions</h4>
                <div className="mt-4">
                    <UploadBar
                        actionDialogue="Select Sound Caption"
                        mediaId={id}
                        uploadUrl="upload/transcript"
                        transcriptType="soundCaption"
                    />
                    <div className="mt-3">
                        <div>
                            <TranscriptList
                                id={id}
                                type="soundCaption"
                                mediaData={mediaData}
                                refreshMediaData={refreshMediaData}
                            />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}
