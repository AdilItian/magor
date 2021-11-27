import React, { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import './TranscriptStudio.css'
import { NavBar } from '../Upload/'
import {
    HorizontalLayout,
    FlexContainerCentered,
    FlexContainer,
} from '../Components'
import toast, { Toaster } from 'react-hot-toast'
import {
    fetchMediaById,
    deleteMediaById,
    deleteTranscriptById,
} from '../Studio/api'
import VideoPreview from '../Components/VideoPreview'
import TranscriptCard from './TranscriptCard'
import { Container, Col } from 'react-bootstrap'

const TranscriptStudio = () => {
    const { id } = useParams()
    const mediaType = 'transcriptStudio'

    const [isLoaded, setIsLoaded] = useState(false)
    const [originalMediaData, setOriginalData] = useState(null)
    const [mediaData, setMediaData] = useState(null)
    const [tempTags, setTempTags] = useState([])
    const [pendingASRs, setPendingASRs] = useState([])
    const [pendingICRs, setPendingICRs] = useState([])
    const [transcripts, setTranscripts] = useState([])

    let mediaUrl
    if (mediaData) {
        mediaUrl = mediaData.tempResourceUrl
        mediaUrl = mediaUrl.substring(mediaUrl.indexOf('recordings/'))
        const studioUrl = process.env.REACT_APP_STUDIO_URL
        mediaUrl = `${studioUrl}/static/${mediaUrl}`
    }

    const refreshMediaData = () => {
        fetchMediaById(id).then(({ media }) => {
            setOriginalData(media)
            setMediaData(media)
            setTranscripts(media._transcripts)
            setTempTags(media['tags'].map((tag) => tag.tagName) || [])
            setIsLoaded(true)
            document.title = 'Studio - ' + media.title
        })
    }

    useEffect(() => {
        refreshMediaData()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <>
            <NavBar />
            <div style={{ marginTop: '7rem', overflowX: 'hidden' }}>
                <Container style={{ maxWidth: '1490px' }}>
                    <div>
                        <HorizontalLayout
                            style={{
                                justifyContent: 'space-between',
                                alignItems: 'center',
                            }}
                        >
                            <div>
                                <h2>Title</h2>
                                <p>
                                    {(mediaData && mediaData.title) ||
                                        'No title'}
                                </p>
                                <h2>Description</h2>
                                <p>
                                    {(mediaData && mediaData.description) ||
                                        'No Description'}
                                </p>
                            </div>
                            {mediaUrl && (
                                <VideoPreview mode="url" src={mediaUrl} />
                            )}
                        </HorizontalLayout>
                    </div>
                    <div>
                        <h2>Transcripts</h2>
                        {transcripts.map((t) => (
                            <TranscriptCard key={t._id} data={t} />
                        ))}
                    </div>
                </Container>
            </div>
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

export default TranscriptStudio
