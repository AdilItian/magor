import * as _ from 'lodash'
import React, { useState, useEffect } from 'react'
import { Container, Row, Col, Form, Button, Tabs, Tab } from 'react-bootstrap'
import { useHistory, useParams } from 'react-router-dom'
import { TagsInput } from '../Components'
import { NavBar } from '../Upload/index'
import VideoPreview from '../Components/VideoPreview'
import {
    fetchMediaById,
    fetchPendingASRRequests,
    fetchPendingICRRequests,
    deleteMediaById,
    updateMediaById,
    processAutoTranscribe,
} from './api'

import './studio.css'
import toast, { Toaster } from 'react-hot-toast'

import CaptionTab from './tabs/CaptionTab'
import BasicDetailsTab from './tabs/BasicDetailsTab'
import PublishTab from './tabs/PublishTab'
import TranscriptsTab from './tabs/TranscriptsTab'
import LoadingScreen from './views/LoadingScreen'
import { lookup } from 'mime-types'
import AudioPreview from '../Components/AudioPreview'

const evaluateDiff = (prev, updated) => {
    let changes = {}
    Object.keys(prev).forEach((key) => {
        if (prev[key] !== updated[key]) {
            changes[key] = updated[key]
        }
    })
    return changes
}

export default (props) => {
    const [isLoaded, setIsLoaded] = useState(false)
    const [originalMediaData, setOriginalData] = useState(null)
    const [mediaData, setMediaData] = useState(null)
    const { id } = useParams()
    const [tempTags, setTempTags] = useState([])
    const [pendingASRs, setPendingASRs] = useState([])
    const [pendingICRs, setPendingICRs] = useState([])
    const history = useHistory()

    useEffect(() => {
        if (
            mediaData &&
            (!mediaData['tags'] || mediaData['tags'] !== tempTags)
        ) {
            setMediaData({
                ...mediaData,
                tags: tempTags,
            })
        }
    }, [mediaData, tempTags])

    useEffect(() => {
        const updatePendingASRs = () => {
            const mediaId = _.get(originalMediaData, '_id', null)
            fetchPendingASRRequests(mediaId)
                .then(({ requests }) => {
                    setPendingASRs(requests)
                })
                .catch(({ response }) => {
                    if (response) {
                        console.error(response.data)
                    }
                })
        }
        if (originalMediaData) {
            updatePendingASRs()
        }
    }, [originalMediaData])

    useEffect(() => {
        const updatePendingICRs = () => {
            const mediaId = _.get(originalMediaData, '_id', null)
            fetchPendingICRRequests(mediaId)
                .then(({ requests }) => {
                    setPendingICRs(requests)
                })
                .catch(({ response }) => {
                    if (response) {
                        console.error(response.data)
                    }
                })
        }
        if (originalMediaData) {
            updatePendingICRs()
        }
    }, [originalMediaData])

    const refreshMediaData = () => {
        fetchMediaById(id).then(({ media }) => {
            setOriginalData(media)
            setMediaData(media)
            setTempTags(media['tags'].map((tag) => tag.tagName) || [])
            setIsLoaded(true)
            document.title = 'Studio - ' + media.title
        })
    }

    useEffect(() => {
        refreshMediaData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const handleMediaDataUpdate = async (e) => {
        e.preventDefault()
        // Send only the fields that have changed
        let updates = evaluateDiff(originalMediaData, mediaData)
        console.log(updates)
        if (!_.isEmpty(updates)) {
            console.log('Changes', updates)
            toast
                .promise(updateMediaById(id, updates), {
                    loading: 'Updating details',
                    success: 'Successfully updated details!',
                    error: (err) => `Error: ${err}`,
                })
                .then(() => {
                    refreshMediaData()
                })
        }
    }

    const handleAutoTranscribe = async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const formDataObject = Object.fromEntries(formData.entries())
        console.log(formDataObject)

        toast
            .promise(processAutoTranscribe(id, formDataObject), {
                loading: 'Upload media for transcription',
                success: 'Successfully started a new job!',
                error: (err) => `Error: ${err}`,
            })
            .then((data) => {
                console.log(data)
                refreshMediaData()
            })
    }

    const isVideoFile = (url) => {
        return lookup(url).includes('video')
    }

    const renderStudio = () => {
        return (
            <div style={{ marginTop: '120px', overflowX: 'hidden' }}>
                <Container style={{ maxWidth: '1490px' }}>
                    <Row
                        style={{
                            paddingLeft: '15px',
                            marginBottom: '15px',
                            marginTop: '5px',
                        }}
                    >
                        <Button
                            className="mr-2"
                            variant="outline-secondary"
                            openInNewTabHref={`/recording/${id}`}
                            onClick={(_) => history.push(`/recording/${id}`)}
                        >
                            Go to video
                        </Button>
                        <Button
                            variant="outline-secondary"
                            openInNewTabHref={`/recording/${id}`}
                            onClick={(_) =>
                                history.push(`/transcriptStudio/${id}`)
                            }
                        >
                            Go to Magor Studio
                        </Button>
                    </Row>
                    <Row>
                        <Col sm={7} className="StudioDetails">
                            <Form onSubmit={(e) => handleMediaDataUpdate(e)}>
                                <Form.Group controlId="formBasicEmail">
                                    <Form.Label>Title</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="title"
                                        placeholder="Enter title for the video"
                                        value={mediaData.title}
                                        onChange={(e) => {
                                            setMediaData({
                                                ...mediaData,
                                                title: e.target.value,
                                            })
                                        }}
                                    />
                                </Form.Group>
                                <Form.Group controlId="formBasicText">
                                    <Form.Label>Description</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        name="description"
                                        rows={3}
                                        type="text"
                                        value={mediaData.description}
                                        onChange={(e) => {
                                            setMediaData({
                                                ...mediaData,
                                                description: e.target.value,
                                            })
                                        }}
                                        placeholder="Enter description for the video"
                                    />
                                </Form.Group>
                                <Form.Group controlId="formBasicTags">
                                    <Form.Label>Tags</Form.Label>
                                    <TagsInput
                                        tags={tempTags}
                                        placeholder="Enter tags separated by comma: Tag1, Tag2, ..."
                                        showLabel={false}
                                        setTags={setTempTags}
                                    />
                                </Form.Group>
                                <Button
                                    variant="outline-success"
                                    type="submit"
                                    className="mb-3"
                                    onClick={handleMediaDataUpdate}
                                >
                                    Save
                                </Button>
                            </Form>
                        </Col>
                        <Col sm={5}>
                            {mediaData.azureUploadStatus === 'success' ? (
                                isVideoFile(mediaData.azureResourceUrl) ? (
                                    <VideoPreview
                                        mode="url"
                                        src={mediaData.azureResourceUrl}
                                    />
                                ) : (
                                    <AudioPreview
                                        mode="url"
                                        src={mediaData.azureResourceUrl}
                                    />
                                )
                            ) : (
                                <div>Uploading file to cloud</div>
                            )}
                        </Col>
                    </Row>
                </Container>
                <Container style={{ maxWidth: '1490px' }} className="mb-5">
                    <Tabs
                        defaultActiveKey="transcripts"
                        id="uncontrolled-tab-example"
                    >
                        <Tab eventKey="basic" title="Basic Details">
                            <BasicDetailsTab mediaData={originalMediaData} />
                        </Tab>
                        <Tab eventKey="transcripts" title="Transcripts">
                            <TranscriptsTab
                                mediaData={originalMediaData}
                                handleAutoTranscribe={handleAutoTranscribe}
                                refreshMediaData={refreshMediaData}
                                id={id}
                                pendingASRs={pendingASRs}
                            />
                        </Tab>
                        <Tab eventKey="captions" title="Captions">
                            <CaptionTab
                                id={id}
                                mediaData={originalMediaData}
                                refreshMediaData={refreshMediaData}
                                pendingICRs={pendingICRs}
                            />
                        </Tab>
                        <Tab eventKey="publish" title="Publish">
                            <PublishTab
                                id={id}
                                mediaData={originalMediaData}
                                deleteMediaById={deleteMediaById}
                                refreshMediaData={refreshMediaData}
                            />
                        </Tab>
                    </Tabs>
                </Container>
            </div>
        )
    }

    return (
        <>
            <NavBar title="Magor Studio" />
            {isLoaded ? renderStudio() : <LoadingScreen />}
            <Toaster
                position="bottom-right"
                reverseOrder
                toastOptions={{
                    style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                    },
                }}
            />
        </>
    )
}
