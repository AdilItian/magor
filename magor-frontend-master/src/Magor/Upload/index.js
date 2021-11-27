import React, { useState, useCallback } from 'react'
import { useHistory } from 'react-router-dom'
import * as _ from 'lodash'

import {
    Title,
    VerticalLayout,
    FlexContainerCentered,
    LabelledInput,
    TagsInput,
    FileInput,
    Button,
    DropDown,
    FlexContainer,
} from '../Components'
import { UserDropdown } from '../Components/AuthElements'

import dataProvider from '../../dataProvider'
import {
    recordingValidator,
    transcriptValidator,
    titleValidator,
    captionsValidator,
    captionTypes,
} from '../Utils/uploadInputValidators'
import { asrLanguages } from '../Utils/ASRConfig'
import { audioTracks, audioTypes } from '../Utils/uploadPanel'

import './upload.css'

const Status = ({ status, type = 'upload' }) => {
    if (status === null) return null
    if (status === '') return null
    return (
        <p className="status">
            <img className={type} src={`/${type}.svg`} alt="Status" />
            {status}
        </p>
    )
}

export default (props) => {
    const [title, setTitle] = useState('')
    const [description, setDescription] = useState('')
    const [tags, setTags] = useState([])
    const [recordingFile, setRecordingFile] = useState()
    const [transcriptFile, setTranscriptFile] = useState()
    const [imageCaptionsFile, setImageCaptionsFile] = useState()
    const [soundCaptionsFile, setSoundCaptionsFile] = useState()
    const [status, setStatus] = useState('')
    const [isError, setError] = useState(false)
    const [genTranscriptFromASR, setGenTranscriptFromASR] = useState(false)
    const [asrLanguage, setAsrLanguage] = useState(asrLanguages[0])
    const [selectedAudioType, setAudioType] = useState(audioTypes[0])
    const [selectedAudioTrack, setAudioTrack] = useState(audioTracks[0])

    const history = useHistory()

    const uploadFile = useCallback(
        (path, field, file) =>
            new Promise((resolve, reject) => {
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
            }),
        []
    )

    const submit = async (_) => {
        try {
            // No error initially
            setError(false)

            // Validate Form
            await titleValidator(title)
            await recordingValidator(recordingFile, 'Recording: ')
            if (!genTranscriptFromASR) {
                await transcriptValidator(transcriptFile, 'Transcript: ')
            }

            // Upload Recording
            const {
                success: { path: recordingPath },
            } = await uploadFile(
                'recordings/uploadRecording',
                'recording',
                recordingFile
            )

            // Upload Transcript
            let transcriptPath = ''
            if (!genTranscriptFromASR) {
                const response = await uploadFile(
                    'recordings/uploadTranscript',
                    'transcript',
                    transcriptFile
                )
                transcriptPath = response.success.path
            }

            // Upload image captions
            let imageCaptionsPath
            if (imageCaptionsFile) {
                const response = await uploadFile(
                    'recordings/uploadTranscript',
                    'transcript',
                    imageCaptionsFile
                )
                imageCaptionsPath = response.success.path
            }

            // Upload sound captions
            let soundCaptionsPath
            if (soundCaptionsFile) {
                const response = await uploadFile(
                    'recordings/uploadTranscript',
                    'transcript',
                    soundCaptionsFile
                )
                soundCaptionsPath = response.success.path
            }

            setStatus('Processing. Please wait...')

            // Submit Form
            const {
                data: { _id: recordingId },
            } = await dataProvider.create('recordings', {
                data: {
                    title,
                    description,
                    path: recordingPath,
                    audioTrack: selectedAudioTrack.value,
                    audioType: selectedAudioType.value,
                    transcripts: [
                        genTranscriptFromASR
                            ? {
                                  path: 'ASR_TEMP',
                                  asrLanguage: asrLanguage.value,
                                  version: 0,
                              }
                            : {
                                  path: transcriptPath,
                                  version: 0,
                              },
                    ],
                    imageCaptions: imageCaptionsFile
                        ? [{ path: imageCaptionsPath, version: 0 }]
                        : [],
                    soundCaptions: soundCaptionsFile
                        ? [{ path: soundCaptionsPath, version: 0 }]
                        : [],
                    tags: tags.map((t) => ({ tagName: t })),
                },
            })
            setStatus('Success. Redirecting...')
            history.push(`/recording/${recordingId}/`)
        } catch (err) {
            setError(true)
            if (typeof err === 'object') {
                if (err.body && err.body.errors && err.body.errors.msg)
                    setStatus(err.body.errors.msg)
                else if (err.error) setStatus(JSON.stringify(err.error))
                else if (err.message) setStatus(err.message)
                else setStatus(JSON.stringify(err))
            } else {
                setStatus('' + err)
            }
        }
    }

    return (
        <>
            <NavBar />
            <FlexContainerCentered id="Upload">
                <VerticalLayout id="UploadLayout">
                    <Title small text="Upload a new Recording" />
                    <h3>Basic Information</h3>
                    <LabelledInput
                        label="Title"
                        validator={titleValidator}
                        value={title}
                        setValue={setTitle}
                    />
                    <LabelledInput
                        type="textarea"
                        label="Description"
                        value={description}
                        setValue={setDescription}
                    />
                    <TagsInput
                        tags={tags}
                        placeholder="Tag1, Tag2, ..."
                        label="Tags"
                        setTags={setTags}
                    />
                    <h3>Choose a recording</h3>
                    <FileInput
                        file={recordingFile}
                        validator={recordingValidator}
                        setFile={setRecordingFile}
                        buttonText={
                            recordingFile
                                ? 'Change Recording'
                                : 'Choose Recording'
                        }
                    />
                    <h3>Choose a transcript</h3>
                    {genTranscriptFromASR && (
                        <>
                            <div style={{ display: 'flex' }}>
                                <label>
                                    A transcript will be generated automatically
                                    in
                                </label>
                                <DropDown
                                    white={true}
                                    list={asrLanguages}
                                    _key="key"
                                    selected={asrLanguage}
                                    setSelected={setAsrLanguage}
                                />
                            </div>
                            <Button
                                small
                                onClick={(_) => setGenTranscriptFromASR(false)}
                            >
                                Upload your own Transcript
                            </Button>
                        </>
                    )}
                    {!genTranscriptFromASR && (
                        <>
                            <FileInput
                                file={transcriptFile}
                                validator={transcriptValidator}
                                setFile={setTranscriptFile}
                                buttonText={
                                    transcriptFile
                                        ? 'Change Transcript'
                                        : 'Choose Transcript'
                                }
                            />
                            <h3 style={{ marginLeft: 20 }}>Or</h3>
                            <FlexContainer className="ASRInput">
                                <Button
                                    small
                                    onClick={(_) =>
                                        setGenTranscriptFromASR(true)
                                    }
                                >
                                    Auto-generate Transcript
                                </Button>
                                <DropDown
                                    white={true}
                                    list={asrLanguages}
                                    _key="key"
                                    selected={asrLanguage}
                                    setSelected={(l) => {
                                        setAsrLanguage(l)
                                        setGenTranscriptFromASR(true)
                                    }}
                                />
                            </FlexContainer>
                        </>
                    )}
                    <h3>Choose Audio Type:</h3>
                    <FlexContainer>
                        <DropDown
                            white={true}
                            list={audioTypes}
                            _key="key"
                            selected={selectedAudioType}
                            setSelected={(l) => {
                                setAudioType(l)
                            }}
                        />
                    </FlexContainer>

                    <h3>Choose Audio Track:</h3>
                    <FlexContainer>
                        <DropDown
                            white={true}
                            list={audioTracks}
                            _key="key"
                            selected={selectedAudioTrack}
                            setSelected={(l) => {
                                setAudioTrack(l)
                            }}
                        />
                    </FlexContainer>

                    <h3>Optionally:</h3>
                    <FileInput
                        file={imageCaptionsFile}
                        validator={captionsValidator(captionTypes.IMAGE)}
                        setFile={setImageCaptionsFile}
                        buttonText={
                            imageCaptionsFile
                                ? 'Change Image Captions'
                                : 'Choose Image Captions'
                        }
                    />
                    <FileInput
                        file={soundCaptionsFile}
                        validator={captionsValidator(captionTypes.SOUND)}
                        setFile={setSoundCaptionsFile}
                        buttonText={
                            soundCaptionsFile
                                ? 'Change Sound Captions'
                                : 'Choose Sound Captions'
                        }
                    />
                    <Status
                        status={status}
                        type={isError ? 'error' : 'upload'}
                    />
                    <Button onClick={submit}>Upload</Button>
                </VerticalLayout>
            </FlexContainerCentered>
        </>
    )
}

export const NavBar = (props) => {
    const currentPath = props.currentPath || 'upload'
    const history = useHistory()
    const goHome = () => history.push('/')
    const title = _.get(props, 'title', 'Magor')
    return (
        <>
            <div className="uploadNavBar">
                <Title small text={title} onClick={goHome} />
                <div style={{ display: 'flex' }}>
                    <UserDropdown currentPath={currentPath} />
                </div>
            </div>
        </>
    )
}
