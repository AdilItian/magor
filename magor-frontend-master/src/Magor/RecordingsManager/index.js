import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'
import moment from 'moment'
import axios from 'axios'
import mime from 'mime-types'

import { NavBar } from '../Upload/'
import { FlexContainerCentered, VerticalLayout, Suspense } from '../Components'
import { Button } from 'react-bootstrap'

import './index.css'
import cx from '../Utils/cx'

const studioUrl = process.env.REACT_APP_STUDIO_URL || 'http://localhost:3002'

const RecordingsManager = (props) => {
    const [page, loadPage] = useState(1)
    const [hash, setHash] = useState(Math.random())
    const reload = () => {
        setHash(Math.random())
    }
    useEffect(() => {
        document.title = 'My Uploads - Magor'
    }, [])
    return (
        <>
            <NavBar currentPath="recordingsManager" />
            <FlexContainerCentered
                id="RecordingsManager"
                style={{ alignItems: 'flex-start' }}
            >
                <VerticalLayout>
                    <Suspense
                        method="getList"
                        _key={`${page}_${hash}`}
                        SuccessDisplay={Recordings}
                        successProps={{ loadPage, reload }}
                        params={[
                            'recordings/userUploads',
                            {
                                pagination: {
                                    page,
                                    perPage: 10,
                                },
                                sort: {
                                    field: 'createdAt',
                                    order: -1,
                                },
                            },
                        ]}
                    />
                </VerticalLayout>
            </FlexContainerCentered>
        </>
    )
}

const Recordings = ({ data: recordings, loadPage, reload }) => {
    const { data, meta } = recordings
    const {
        totalDocs,
        page,
        limit,
        hasNextPage,
        hasPrevPage,
        nextPage,
        prevPage,
    } = meta
    return (
        <div id="recordingsList">
            <p>
                <label
                    onClick={(_) => loadPage(prevPage)}
                    className={cx({ link: true, active: hasPrevPage })}
                >
                    {'< Previous Page '}
                </label>
                Showing {(page - 1) * limit + 1} to {page * limit} of{' '}
                {totalDocs} result(s)
                <label
                    onClick={(_) => loadPage(nextPage)}
                    className={cx({ link: true, active: hasNextPage })}
                >
                    {' Next Page > '}
                </label>
            </p>
            <div className="recording header">
                <label>Title</label>
                <label>Created</label>
                <label>Recording Type</label>
                <label />
                <label />
                <label />
            </div>
            {data.map((rec) => (
                <Recording reload={reload} key={rec.id} {...rec} />
            ))}
        </div>
    )
}

const Recording = (props) => {
    const history = useHistory()
    const [willDelete, setWillDelete] = useState(false)
    const deleteRecording = async () => {
        try {
            const token = localStorage.getItem('token')
            const result = await axios.delete(`${studioUrl}/media`, {
                params: { id: props.id },
                headers: { authorization: `Bearer ${token}` },
            })
            console.log(result)
            setWillDelete(true)
            setTimeout(props.reload, 1000)
        } catch (err) {
            console.error(err)
        }
    }
    return (
        <div
            className={`recording ${willDelete && 'willDelete'}`}
            title={props.id}
        >
            <label title={props.id}>{props.title}</label>
            <label className="recordingDescriptor red">
                {moment(props.createdAt).fromNow()}
            </label>
            <label className="recordingDescriptor violet">
                {mime.lookup(props.path)}
            </label>
            <Button
                openInNewTabHref={'/recording/' + props.id}
                onClick={(_) => history.push('/recording/' + props.id)}
            >
                View
            </Button>
            <Button
                openInNewTabHref={'/studio/' + props.id}
                onClick={(_) => history.push('/studio/' + props.id)}
            >
                Edit
            </Button>
            <Button variant="danger" onClick={deleteRecording}>
                Delete
            </Button>
        </div>
    )
}

export default RecordingsManager
