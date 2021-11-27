import React, { useState, useCallback, useRef, useEffect } from 'react'
import mime from 'mime-types'

import {
    VerticalLayout,
    FlexContainerCentered,
    Para,
    Button,
    DropDown,
} from '../Components'
import { NavBar } from '../Upload/'

import dataProvider from '../../dataProvider'
import {
    titleValidator,
    recordingValidator,
    transcriptValidator,
} from '../Utils/uploadInputValidators'
import { asrLanguages } from '../Utils/ASRConfig'

import './upload.css'
import './UploadBatch.css'

export default (props) => {
    const filesInput = useRef()
    const [data, setData] = useState(null)
    const [asrLanguage, setAsrLanguage] = useState(asrLanguages[0])
    useEffect(() => {
        document.title = "Batch Upload - Magor"
    }, [])

    const uploadFile = useCallback(
        (path, field, file, statusElement) =>
            new Promise((resolve, reject) => {
                const progressCallback = ({ loaded, total }) => {
                    statusElement.innerHTML = `Uploading ${
                        file.name
                    } ${parseFloat((loaded * 100) / total).toFixed(2)}%`
                }
                const xhr = dataProvider.uploadFile(
                    path,
                    field,
                    file,
                    progressCallback
                )
                statusElement.innerHTML = `Uploading ${file.name}... Please Wait.`
                xhr.onload = (res) => {
                    statusElement.innerHTML = `Uploaded ${file.name}.`
                    if (xhr.status !== 200) reject(JSON.parse(xhr.response))
                    else resolve(JSON.parse(xhr.response))
                }
                xhr.onerror = (_) => {
                    statusElement.innerHTML = `Error uploading ${file.name}`
                    reject(JSON.parse(xhr.response))
                }
            }),
        []
    )

    const uploadFiles = async (_) => {
        const validSets = Object.keys(data).filter((k) => data[k].valid)
        for (let setID of validSets) {
            const set = data[setID]
            const statusElement = document
                .getElementById(setID)
                .querySelector('label')

            try {
                // Upload Recording
                const {
                    success: { path: recordingPath },
                } = await uploadFile(
                    'recordings/uploadRecording',
                    'recording',
                    set.recording,
                    statusElement
                )

                // Upload Transcript
                let transcriptPath = set.transcript.path
                if (set.transcript.size) {
                    const {
                        success: { path: _transcriptPath },
                    } = await uploadFile(
                        'recordings/uploadTranscript',
                        'transcript',
                        set.transcript,
                        statusElement
                    )
                    transcriptPath = _transcriptPath
                }
                statusElement.innerHTML = 'Processing...'

                // Submit Form
                const {
                    data: { _id: recordingId },
                } = await dataProvider.create('recordings', {
                    data: {
                        title: set.title,
                        description: set.description,
                        path: recordingPath,
                        transcripts: [
                            {
                                path: transcriptPath,
                                version: 0,
                            },
                        ],
                        imageCaptions: [],
                        soundCaptions: [],
                        tags: [],
                    },
                })
                statusElement.innerHTML = `Uploaded. Recording ID: <a href="/recording/${recordingId}">${recordingId}</a>`
            } catch (err) {
                statusElement.innerHTML = `Error: ${
                    typeof err === 'object' ? JSON.stringify(err) : err
                }`
                continue
            }
        }
    }

    const parse = async (_) => {
        const files = filesInput.current.files
        const fileTree = {
            ignoredFiles: [],
        }
        for (let file of files) {
            const name = file.name
            const mimeType = mime.lookup(name)
            let fileType
            if (mimeType.match(/^(audio|video)\//i)) {
                fileType = 'recording'
            } else if (name.match(/\.info.json$/i)) {
                fileType = 'info'
            } else if (name.match(/(srt|vtt|stm|textgrid|xml|json)$/i)) {
                fileType = 'transcript'
            } else {
                fileTree.ignoredFiles.push(name)
                continue
            }
            const id = name.split('.')[0]
            if (!fileTree[id]) {
                fileTree[id] = {}
            }
            fileTree[id][fileType] = file
        }
        for (let set in fileTree) {
            if (set === 'ignoredFiles') continue
            const setObject = fileTree[set]
            if (setObject.recording == null) {
                // invalid set
                setObject.valid = false
                setObject.message = 'Recording file is required!'
            }
            if (setObject.transcript == null) {
                setObject.transcript = {
                    path: 'ASR_TEMP',
                    asrLanguage: asrLanguage.value,
                    version: 0,
                }
            }
            try {
                const info = setObject.info
                    ? JSON.parse(await setObject.info.text())
                    : {}
                const { title = set, description = '' } = info
                setObject.title = title
                setObject.description = description.split('.')[0]
                await titleValidator(setObject.title)
                await recordingValidator(setObject.recording, 'Recording: ')
                if (setObject.transcript.file)
                    await transcriptValidator(
                        setObject.transcript,
                        'Transcript: '
                    )
                setObject.valid = true
                setObject.message = JSON.stringify(
                    Object.keys(setObject).filter(
                        (f) =>
                            ['title', 'description', 'valid'].indexOf(f) === -1
                    )
                )
                if (!setObject.transcript.size)
                    setObject.message += ' (Transcript will be auto-generated)'
            } catch (err) {
                setObject.valid = false
                if (typeof err === 'object') {
                    if (err.error) setObject.message = err.error
                    else if (err.message) setObject.message = err.message
                    else setObject.message = JSON.stringify(err)
                } else {
                    setObject.message = '' + err
                }
            }
        }
        setData(fileTree)
    }
    return (
        <>
            <NavBar currentPath="batchUpload" />
            <FlexContainerCentered id="Upload">
                <VerticalLayout id="UploadLayout">
                    <div>
                        <Para>
                            Please Select sets of Multiple files of the format:
                            <br />
                            If recording name is "abc.mp4" for example,
                            <br />
                            Choose multiple sets of files, with each set
                            containing:
                            <br />
                            (If any set is incomplete or if any additional files
                            are selected, they will be safely ignored.)
                        </Para>
                        <ol>
                            <li>abc.mp4</li>
                            <li>
                                abc.info.json <b>(optional)</b>
                            </li>
                            <li style={{ display: 'flex' }}>
                                abc.*.transcript (optional. If not provided, a
                                transcript will be auto-generated in
                                <DropDown
                                    small
                                    white
                                    list={asrLanguages}
                                    _key="key"
                                    selected={asrLanguage}
                                    setSelected={setAsrLanguage}
                                />
                                )
                            </li>
                        </ol>
                        <Para>Where,</Para>
                        <ul>
                            <li>
                                transcript = VTT, SRT, STM, ASR JSON, ASR XML,
                                or TextGrid file.{' '}
                            </li>
                            <li>
                                * = a language (usually en) but this part is
                                ignored by the algorithm anyway.
                            </li>
                            <li>
                                info.json should have a title and description
                                field. (default title: name of recording file.
                                default description: '')
                            </li>
                        </ul>
                    </div>
                    <input
                        style={{ fontSize: 20 }}
                        ref={filesInput}
                        type="file"
                        multiple={true}
                    />
                    <Button onClick={parse}>Parse Files</Button>
                    {data && (
                        <div>
                            <Para>
                                Valid Sets:{' '}
                                {
                                    Object.keys(data).filter(
                                        (k) => data[k].valid
                                    ).length
                                }
                            </Para>
                            {Object.keys(data)
                                .filter((k) => k !== 'ignoredFiles')
                                .map((k) => (
                                    <div key={k} id={k}>
                                        <Para
                                            className={`file ${
                                                data[k].valid
                                                    ? 'valid'
                                                    : 'error'
                                            }`}
                                        >
                                            {k}
                                            {' –'}
                                            <label>
                                                {data[k].message || ''}
                                            </label>
                                        </Para>
                                    </div>
                                ))}
                            <Button onClick={uploadFiles}>Upload Files</Button>
                        </div>
                    )}
                </VerticalLayout>
            </FlexContainerCentered>
        </>
    )
}
