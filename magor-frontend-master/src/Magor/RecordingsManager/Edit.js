import React, { useState, useCallback } from 'react'
import { useParams, useHistory } from 'react-router-dom'

import {
    titleValidator,
    transcriptValidator,
    captionsValidator,
    captionTypes,
} from '../Utils/uploadInputValidators'

import dataProvider from '../../dataProvider'
import { NavBar } from '../Upload/'
import {
    FlexContainerCentered,
    VerticalLayout,
    Suspense,
    Button,
    LabelledInput,
    TagsInput,
    TranscriptsInput,
} from '../Components'

import './edit.css'

const Edit = (props) => {
    const { recordingId } = useParams()
    return (
        <>
            <NavBar currentPath="edit" />
            <FlexContainerCentered id="Edit">
                <VerticalLayout>
                    <Suspense
                        method="getOne"
                        _key={recordingId}
                        SuccessDisplay={Recording}
                        params={['recordings', { id: recordingId }]}
                    />
                </VerticalLayout>
            </FlexContainerCentered>
        </>
    )
}

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

const Recording = ({ data: { data: recording } }) => {
    const [newTitle, setNewTitle] = useState(recording.title)
    const [newDescription, setNewDescription] = useState(recording.description)
    const [newTags, setNewTags] = useState(recording.tags.map((t) => t.tagName))
    const [newTranscripts, setNewTranscripts] = useState(recording.transcripts)
    const [newImageCaptions, setNewImageCaptions] = useState(
        recording.imageCaptions
    )
    const [newSoundCaptions, setNewSoundCaptions] = useState(
        recording.soundCaptions
    )

    const [status, setStatus] = useState('')
    const [isError, setError] = useState(false)

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

    const deleteRecording = async () => {
        try {
            await dataProvider.delete('recordings', { id: recording._id })
            history.push('/recordingsManager')
        } catch (err) {
            console.error(err)
        }
    }

    const update = async (_) => {
        setError(false)
        try {
            await titleValidator(newTitle)

            const transcriptsToUpload = [
                ...newTranscripts,
                ...newImageCaptions,
                ...newSoundCaptions,
            ].filter((t) => t.isNew)
            for (let tx of transcriptsToUpload) {
                if (tx.shouldUseASR) continue
                await transcriptValidator(
                    tx.file,
                    `Transcript ${tx.file.name}: `
                )
            }
            for (let tx of transcriptsToUpload) {
                if (tx.shouldUseASR) {
                    tx.path = 'ASR_TEMP'
                    tx.asrLanguage = tx.asrLanguage.value
                } else {
                    const {
                        success: { path },
                    } = await uploadFile(
                        'recordings/uploadTranscript',
                        'transcript',
                        tx.file
                    )
                    tx.path = path
                    delete tx.asrLanguage
                }
            }
            await dataProvider.update('recordings', {
                id: recording._id,
                data: {
                    title: newTitle,
                    description: newDescription,
                    tags: newTags.map((t) => ({ tagName: t })),
                    path: recording.path,
                    transcripts: newTranscripts.map(({ path, name }) => ({
                        path,
                        name,
                        version: 0,
                    })),
                    imageCaptions: newImageCaptions.map(({ path, name }) => ({
                        path,
                        name,
                        version: 0,
                    })),
                    soundCaptions: newSoundCaptions.map(({ path, name }) => ({
                        path,
                        name,
                        version: 0,
                    })),
                },
            })
            setStatus('Success. Redirecting...')
            setTimeout((_) => history.goBack(), 2000)
        } catch (err) {
            setError(true)
            if (typeof err === 'object') {
                if (err.error) setStatus(err.error)
                else if (err.message) setStatus(err.message)
                else setStatus(JSON.stringify(err))
            } else {
                setStatus('' + err)
            }
        }
    }
    return (
        <div id="EditLayout">
            <LabelledInput
                label="Title"
                value={newTitle}
                setValue={setNewTitle}
                validator={titleValidator}
            />
            <LabelledInput
                type="textarea"
                label="Description"
                value={newDescription}
                setValue={setNewDescription}
            />
            <TagsInput
                tags={newTags}
                placeholder="Tag1, Tag2, ..."
                label="Tags"
                setTags={setNewTags}
            />
            <TranscriptsInput
                label="Transcripts"
                transcripts={newTranscripts}
                setTranscripts={setNewTranscripts}
                allowASR={true}
            />
            <TranscriptsInput
                label="Image Captions"
                transcripts={newImageCaptions}
                setTranscripts={setNewImageCaptions}
                validator={captionsValidator(captionTypes.IMAGE)}
                allowEmpty={true}
            />
            <TranscriptsInput
                label="Sound Captions"
                transcripts={newSoundCaptions}
                setTranscripts={setNewSoundCaptions}
                validator={captionsValidator(captionTypes.SOUND)}
                allowEmpty={true}
            />
            <Status status={status} type={isError ? 'error' : 'upload'} />
            <Button style={{ marginRight: 10 }} onClick={update}>
                Update
            </Button>
            <Button style={{ background: 'red' }} onClick={deleteRecording}>
                DELETE RECORDING
            </Button>
        </div>
    )
}

export default Edit
