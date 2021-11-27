import _ from 'lodash'
import axios from 'axios'
import React, { useState, useCallback } from 'react'
import { Form, Button } from 'react-bootstrap'
import dataProvider from '../../dataProvider'
import toast from 'react-hot-toast'

export default (props) => {
    const actionDialogue = _.get(props, 'actionDialogue', 'Select File')
    const uploadUrl = _.get(props, 'uploadUrl', 'upload/transcript')
    const mediaId = _.get(props, 'mediaId')
    const transcriptType = _.get(props, 'transcriptType', 'transcript')
    const onSuccess = _.get(props, 'onSuccess', () =>
        console.log('Succesfully upload transcript!')
    )

    const [selectedFile, setSelectedFile] = useState(null)
    const [isFileSelected, setIsFileSelected] = useState(false)
    const [status, setStatus] = useState('')

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

    const handleSelectedFile = (e) => {
        const file = e.currentTarget.files[0]
        setSelectedFile(file)
        setIsFileSelected(true)
        console.log('file', file)
    }

    const resetFormData = () => {
        setSelectedFile(null)
        setIsFileSelected(false)
        setStatus('')
    }

    const handleFileUpload = async (e) => {
        console.log('selectedFile', selectedFile)
        const url = `${process.env.REACT_APP_STUDIO_URL}/transcript`

        let payload = {
            language: 'english',
            format: 'srt',
            mediaId,
            transcriptType,
        }
        debugger
        try {
            let newTranscript = await axios.post(url, payload)
            debugger
            const transcriptId = newTranscript.data.transcript['_id']
            console.log(transcriptId)
            await toast
                .promise(
                    uploadFile(
                        `${uploadUrl}/?id=${transcriptId}`,
                        'transcript',
                        selectedFile,
                        transcriptId
                    ),
                    {
                        loading: `Uploading Transcript`,
                        success: `Successfully uploaded transcript: ${transcriptId}!`,
                        error: (err) => `Error: ${err}`,
                    }
                )
                .then((result) => {
                    console.log(result)
                    resetFormData()
                    if (_.isFunction(onSuccess)) {
                        onSuccess()
                    }
                })
        } catch (err) {
            console.log(err)
        }
    }

    return (
        <div className="p-4 border rounded-3 d-flex flex-column">
            <div>
                <Form.File
                    id="exampleFormControlFile1"
                    label={actionDialogue}
                    onChange={handleSelectedFile}
                />
            </div>
            <div>
                {isFileSelected && (
                    <Button
                        onClick={handleFileUpload}
                        variant="success"
                        size="sm"
                        className="mt-2"
                    >
                        Upload
                    </Button>
                )}
            </div>
            <div className="mt-3">{isFileSelected && status}</div>
        </div>
    )
}
