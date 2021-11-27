import React, { useState, useEffect, useCallback } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import FuzzySearch from 'fuzzy-search'
import './Recording.css'

import cx from '../Utils/cx'
import { FlexContainerCentered, FlexWrap, VerticalLayout } from '../Components/'
import {
    Title,
    Para,
    Suspense,
    SearchBar,
    SearchButton,
    DropDown,
} from '../Components/'
import { UserDropdown } from '../Components/AuthElements'
import AVFile from './AVFile'
import tagTrimmer from '../tagTrimmer'
import { emotions } from '../Utils/getEmotion'
import TranscriptEditor from '../Studio/TranscriptEditor'

export const THIS_REC = 'This recording'
export const ALL_REC = 'All recordings'

const EditButton = ({ id }) => {
    const history = useHistory()
    const role = localStorage.getItem('role')
    const EDIT_PAGES = {
        EDIT_VIDEO: 'Edit Video',
    }

    const handleEditClick = (val) => {
        if (val === EDIT_PAGES.EDIT_VIDEO) {
            history.push(`/studio/${id}`)
        }
    }

    if (role === 'admin' || role === 'uploader') {
        return (
            <>
                {/* <Button
                    id="EditButton"
                    openInNewTabHref={`/studio/${id}`}
                    onClick={(_) => history.push(`/studio/${id}`)}
                >
                    Edit
                </Button> */}
                <DropDown
                    selected={'Edit'}
                    list={[EDIT_PAGES.EDIT_VIDEO, EDIT_PAGES.EDIT_TRANSCRIPT]}
                    setSelected={handleEditClick}
                />
            </>
        )
    } else return null
}

const EditTranscript = ({ data, query: _query, id }) => {
    const recording = data.data
    console.log('recording', recording)
    useEffect(() => {
        document.title = recording.title + ' - Magor'
    }, [recording])
    const tags = tagTrimmer(recording.tags.map((tag) => tag.tagName))
    const [seek, setSeek] = useState(0)
    const [jump, jumpTo] = useState(null)
    const [query, setQuery] = useState(_query)
    const [highlights, setHighlights] = useState([])
    const [currentCaption, setCurrentCaption] = useState(null)
    const [imageAndSoundCaptions, setImageAndSoundCaptions] = useState([])
    const [speakers, setSpeakers] = useState([])
    const [topWords, setTopWords] = useState([])
    const mediaType = 'video'
    // const mediaType = mime.lookup(recording.path).split('/')[0]
    const setHighlight = useCallback((s, d, w) => {
        setHighlights((highlights) => {
            const newHighlights = [...highlights]
            let found
            for (let highlight of newHighlights) {
                if (highlight.s === s && highlight.d === d) {
                    highlight.w.add(w)
                    found = true
                    break
                }
            }
            if (!found)
                newHighlights.push({
                    s,
                    d,
                    w: new Set([w]),
                })
            return newHighlights
        })
    }, [])
    const performSearch = (s) => {
        setHighlights([])
        setQuery(s)
    }
    const history = useHistory()
    const performGlobalSearch = (s) => {
        history.push(`/search/${s}`)
    }
    let _key = 0
    let { tempResourceUrl: mediaUrl } = recording
    mediaUrl = mediaUrl.substring(mediaUrl.indexOf('recordings/'))
    const studioUrl = process.env.REACT_APP_STUDIO_URL
    mediaUrl = `${studioUrl}/static/${mediaUrl}`
    console.log('mediaUrl', mediaUrl)
    return (
        <>
            <RecordingSearch
                query={query}
                performSearch={performSearch}
                performGlobalSearch={performGlobalSearch}
                speakers={speakers}
            />
            <FlexContainerCentered
                id="Recording"
                stretch={true}
                style={{ overflowX: 'hidden' }}
            >
                <VerticalLayout id="LeftPanel">
                    <AVFile
                        jump={jump}
                        jumpTo={jumpTo}
                        setSeek={setSeek}
                        highlights={highlights}
                        currentCaption={currentCaption}
                        imageAndSoundCaptions={imageAndSoundCaptions}
                        path={
                            'http://localhost:3002/static/recordings/6f098a2f-4422-4d14-90cc-244c32c92a4b.mp4'
                        }
                    />
                </VerticalLayout>
                <VerticalLayout
                    id="RightPanel"
                    className={cx('recordingVerticalLayout', mediaType)}
                >
                    <div style={{ display: 'flex' }}>
                        <Title
                            small
                            text={recording.title}
                            query={query}
                            style={{ marginLeft: 0 }}
                        />
                        <div>
                            {recording.description.length > 0 && (
                                <Para
                                    query={query}
                                    text={recording.description}
                                />
                            )}
                        </div>
                    </div>
                    <TranscriptEditor transcript={recording._transcripts[0]} />
                </VerticalLayout>
            </FlexContainerCentered>
        </>
    )
}

const RecordingSearch = (props) => {
    const getFuzzyProps = (speakers = []) => [
        ...speakers.map((s) => `speaker:${s}`),
        ...Object.keys(emotions).map((k) => `emotion:${k.toLowerCase()}`),
    ]
    const [newQuery, setNewQuery] = useState(props.query || '')
    const [searchIn, setSearchIn] = useState(THIS_REC)
    const [searcher, setSearcher] = useState(
        new FuzzySearch(getFuzzyProps(props.speakers))
    )
    const [matches, setMatches] = useState([])
    const history = useHistory()
    const performSearch = (query) => {
        if (searchIn === THIS_REC) props.performSearch(query || newQuery)
        else props.performGlobalSearch(query || newQuery)
    }
    const handleChange = (newQuery = '') => {
        if (searchIn === THIS_REC && newQuery !== '') {
            setMatches(searcher.search(newQuery))
        } else {
            setMatches([])
        }
        setNewQuery(newQuery)
    }
    useEffect(() => {
        setNewQuery(props.query)
    }, [props.query])
    useEffect(() => {
        setSearcher(new FuzzySearch(getFuzzyProps(props.speakers)))
    }, [props.speakers])
    return (
        <div className="recordingNavBar">
            <Title small text="Magor" onClick={(_) => history.push('/')} />
            <div style={{ display: 'flex', position: 'relative' }}>
                <SearchBar
                    small
                    value={newQuery}
                    placeholder="Search"
                    performSearch={performSearch}
                    handleChange={handleChange}
                    matches={matches}
                />
                <div id="DropDownContainer">
                    <DropDown
                        selected={searchIn}
                        list={[THIS_REC, ALL_REC]}
                        setSelected={setSearchIn}
                    />
                </div>
                <SearchButton
                    small
                    style={{ borderLeft: 'none' }}
                    performSearch={() => performSearch()}
                />
            </div>
            <UserDropdown />
        </div>
    )
}

const RecordingRenderer = (props) => {
    const { id, query } = useParams()
    if (id == null) return null
    return (
        <Suspense
            SuccessDisplay={EditTranscript}
            successProps={{ query, id }}
            method="getOne"
            _key={id}
            params={['recordings', { id }]}
        />
    )
}

export default RecordingRenderer
