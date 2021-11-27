import React from 'react'

import { Alert, Form, Button } from 'react-bootstrap'

import { updateMediaById } from '../api'

import toast from 'react-hot-toast'

import { AsyncSpinner } from '../../Components'
import { useHistory } from 'react-router'

export default (props) => {
    const { id, mediaData, deleteMediaById, refreshMediaData } = props

    const history = useHistory()

    const handleSetPublishStatus = async (e) => {
        e.preventDefault()
        const formData = new FormData(e.target)
        const formDataObject = Object.fromEntries(formData.entries())
        try {
            toast
                .promise(updateMediaById(id, formDataObject), {
                    loading: 'Updating publish status',
                    success: 'Successfully updated publish status!',
                    error: (err) => `Error: ${err}`,
                })
                .then(() => {
                    refreshMediaData()
                })
        } catch (err) {
            console.log(err)
        }
    }

    return (
        <div className="py-4">
            <Alert variant="success" className="border py-4">
                <Form onSubmit={handleSetPublishStatus}>
                    <Form.Group controlId="languageSelect">
                        <Form.Label>
                            <h5>Set Publish Status</h5>
                        </Form.Label>
                        <Form.Control
                            as="select"
                            name="publishStatus"
                            defaultValue={mediaData['publishStatus']}
                            custom
                        >
                            <option value="draft">Private</option>
                            <option value="private">Unlisted</option>
                            <option value="public">Public</option>
                        </Form.Control>
                    </Form.Group>
                    <Form.Group>
                        <Button variant="success" type="submit">
                            Save
                        </Button>
                    </Form.Group>
                </Form>
            </Alert>
            <Alert variant="danger" className="mt-3 py-4">
                <h5>Delete Media</h5>
                <p>
                    If you choose to continue, the transcripts and video/audio
                    will also be deleted.
                </p>
                <AsyncSpinner
                    variant="danger"
                    value="Proceed"
                    shouldConfirm
                    onClick={() => deleteMediaById(id)}
                    postSuccess={() => history.push('/')}
                ></AsyncSpinner>
            </Alert>
        </div>
    )
}
