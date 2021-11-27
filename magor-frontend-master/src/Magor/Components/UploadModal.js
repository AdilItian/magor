import React, { useState, useRef, useCallback } from 'react'
import { Container, Modal, Row, Col, Button, Form } from 'react-bootstrap'
import axios from 'axios'
import VideoPreview from './VideoPreview'
import { useHistory } from 'react-router-dom'

import dataProvider from '../../dataProvider'

import uploadSelectSvg from './upload_select.svg'
import AudioPreview from './AudioPreview'

export const UploadModal = (props) => {
    const [isVisible, setVisible] = useState(true)
    const fileInputRef = useRef(null)
    const [isFileSelected, setFileSelected] = useState(false)
    const [selectedFile, setSelectedFile] = useState(null)
    const [isProcessing, setProcessing] = useState(false)
    const [status, setStatus] = useState('Initializing')
    const history = useHistory()

    const TOTAL_STEPS = 2
    const [currentStep, setCurrentStep] = useState(0)

    const renderLastModified = (raw) => {
        let date = new Date(raw)
        return `${date.getDate()}/${date.getMonth()}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}`
    }

    const handleSelectedFile = (e) => {
        e.persist()
        const file = e.target.files[0]
        setSelectedFile(file)
        console.log(file)
        setFileSelected(true)
    }

    const uploadFile = useCallback((path, field, file, mediaID) => {
        return new Promise((resolve, reject) => {
            const progressCallback = ({ loaded, total }) => {
                setStatus(
                    `Uploading ${file.name} ${parseFloat(
                        (loaded * 100) / total
                    ).toFixed(2)}%`
                )
            }

            const xhr = dataProvider.uploadFile(
                path,
                field,
                file,
                mediaID,
                progressCallback
            )

            setStatus(`Uploading ${file.name}... Please Wait.`)

            xhr.onload = (res) => {
                setStatus(`Uploaded ${file.name}.`)
                if (xhr.status !== 200) reject(JSON.parse(xhr.response))
                else resolve(JSON.parse(xhr.response))
            }

            xhr.onerror = (_) => {
                setStatus(`Error uploading ${file.name}`)
                reject(JSON.parse(xhr.response))
            }
        })
    }, [])

    const isVideoFile = (type = 'video') => {
        return type.includes('video')
    }

    const handleUploadProcess = async () => {
        // change button and footer state

        setProcessing(true)

        const url = `${process.env.REACT_APP_STUDIO_URL}/media`

        let payload = {
            title: selectedFile['name'],
        }

        setCurrentStep(1)
        setStatus('Creating new media')
        const token = localStorage.getItem('token')

        let newMedia = await axios.post(url, payload, {
            headers: { authorization: `Bearer ${token}` },
        })

        setCurrentStep(2)
        setStatus('Media created. Uploading file')

        console.log(newMedia.data)

        // create item and get id
        const mediaID = newMedia.data.media['_id']

        // upload file
        let data = await uploadFile(
            `upload/recording/?id=${mediaID}`,
            'recording',
            selectedFile,
            mediaID
        )

        setStatus('Upload successful. Automatically redirecting to studio.')

        setTimeout(() => {
            setVisible(false)
            history.push(`/studio/${mediaID}`)
            window.alert('Redirected')
        }, 1000)

        console.log('Successfully uploaded the file: ', data)
    }

    const renderFileSelection = () => {
        return (
            <div className="d-flex flex-column align-items-center py-5">
                <img src={uploadSelectSvg} height="100px" alt="upload-icon" />
                <h4 className="mt-3">Select audio/video file</h4>
                <Form.File
                    ref={fileInputRef}
                    id="exampleFormControlFile1"
                    label="Choose the media file"
                    onChange={handleSelectedFile}
                    style={{ display: 'none' }}
                />
                <Button
                    variant="primary"
                    className="mt-3"
                    onClick={() => {
                        fileInputRef.current.click()
                    }}
                >
                    Browse
                </Button>
                <p className="text-muted mt-3">
                    This will be saved as a draft until published.
                </p>
            </div>
        )
    }

    const renderFilePreview = () => {
        return (
            <div className="p-3">
                <Container>
                    <Row>
                        <Col xs={12} md={6}>
                            <h4>{selectedFile.name}</h4>
                            <ul className="mt-4 list-group">
                                <li className="list-group-item">
                                    Type: {selectedFile.type}
                                </li>
                                <li className="list-group-item">
                                    Size:{' '}
                                    {(selectedFile.size / 1000000).toFixed(2)}MB
                                </li>
                                <li className="list-group-item">
                                    Last Modified:{' '}
                                    {renderLastModified(
                                        selectedFile.lastModifiedDate
                                    )}
                                </li>
                            </ul>
                            {!isProcessing && (
                                <div className="d-flex mt-3">
                                    <Button
                                        variant="success"
                                        className="mr-2"
                                        onClick={handleUploadProcess}
                                    >
                                        Upload
                                    </Button>
                                    <Button variant="outline-dark">
                                        Browse Another
                                    </Button>
                                </div>
                            )}
                        </Col>
                        <Col
                            xs={6}
                            md={6}
                            className="d-flex flex-column justify-content-center align-items-center"
                        >
                            {isVideoFile(selectedFile.type) ? (
                                <VideoPreview mode="file" src={selectedFile} />
                            ) : (
                                <AudioPreview mode="file" src={selectedFile} />
                            )}
                        </Col>
                    </Row>
                </Container>
            </div>
        )
    }

    const renderFooter = () => {
        return (
            <Modal.Footer className="d-flex justify-content-start px-4">
                {`Step (${currentStep}/${TOTAL_STEPS})  ${status}`}
            </Modal.Footer>
        )
    }

    return (
        <Modal
            show={props.show && isVisible}
            onHide={props.handleClose}
            onExited={() => {}}
            centered
            size="xl"
            backdrop="static"
            keyboard={false}
        >
            <Modal.Header className="px-5" closeButton closeLabel="Close">
                <Modal.Title as="h2">Upload</Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {isFileSelected ? renderFilePreview() : renderFileSelection()}
            </Modal.Body>
            {isProcessing && renderFooter()}
        </Modal>
    )
}
