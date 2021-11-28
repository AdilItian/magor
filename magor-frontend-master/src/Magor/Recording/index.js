import React, { useState, useEffect, useCallback } from 'react'
import { useHistory, useParams } from 'react-router-dom'
import FuzzySearch from 'fuzzy-search'
import axios from 'axios'
import xml2js from 'xml2js'
import './Recording.css'
import TranscriptEditor from '../Studio/TranscriptEditor'
import cx from '../Utils/cx'
import { FlexContainerCentered, FlexWrap, VerticalLayout } from '../Components/'
import {
    Title,
    Para,
    Tag,
    Suspense,
    SearchBar,
    SearchButton,
    DropDown,
    Button,
} from '../Components/'
import { UserDropdown } from '../Components/AuthElements'
import Transcript from './Transcript'
import AVFile from './AVFile'
import tagTrimmer from '../tagTrimmer'
import { emotions } from '../Utils/getEmotion'
import Timeline from './Timeline'

export const THIS_REC = 'This recording'
export const ALL_REC = 'All recordings'

const Recording = ({ data, query: _query, id, transcriptId }) => {
    const recording = data.data

    const EDIT_PAGES = {
        EDIT_VIDEO: 'Edit Video',
        EDIT_TRANSCRIPT: 'Edit Transcript',
        PUBLISH: 'Publish',
    }

    let defaultTranscript = recording._transcripts.find(
        (f) => f._id === recording._defaultTranscript
    )
    if (!defaultTranscript && recording._transcripts.length) {
        defaultTranscript = recording._transcripts[0]
    }
    if (transcriptId) {
        defaultTranscript = recording._transcripts.find(
            (f) => f._id === transcriptId
        )
    }

    useEffect(() => {
        document.title = recording.title + ' - Magor'
    }, [recording])
    const tags = tagTrimmer(recording.tags.map((tag) => tag.tagName))
    const [seek, setSeek] = useState(0)
    const [jump, jumpTo] = useState(null)
    const [query, setQuery] = useState(_query)
    const [highlights, setHighlights] = useState([])
    const [currentPage, setCurrentPage] = useState(
        transcriptId ? EDIT_PAGES.EDIT_TRANSCRIPT : 'Edit'
    )
    const [currentCaption, setCurrentCaption] = useState(null)
    const [imageAndSoundCaptions, setImageAndSoundCaptions] = useState([])
    const [speakers, setSpeakers] = useState([])
    const [topWords, setTopWords] = useState([])

    const [transcriptData, setTranscriptData] = useState(null)
    const [fileName, setFileName] = useState(null)

    useEffect(() => {
        if (defaultTranscript) {
            ;(async () => {
                const { tempResourceUrl } = defaultTranscript
                const transcriptFileName = tempResourceUrl.split('/').pop()
                setFileName(transcriptFileName)
                const { data } = await axios.get(
                    `${process.env.REACT_APP_STUDIO_URL}/static/transcripts/${transcriptFileName}`
                )
                let parser = new xml2js.Parser()
                parser.parseString(data.toString(), function (err, result) {
                    setTranscriptData(result)
                })
            })()
        }
    }, [defaultTranscript])

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

    const EditButton = ({ id }) => {
        const history = useHistory()
        const role = localStorage.getItem('role')
        const handleEditClick = (val) => {
            if (val === EDIT_PAGES.PUBLISH) {
                return false
            }
            setCurrentPage(val)
            if (val === EDIT_PAGES.EDIT_VIDEO) {
                history.push(`/studio/${id}`)
            }
        }

        if (role === 'admin' || role === 'uploader') {
            return (
                <DropDown
                    selected={currentPage}
                    list={[
                        'Edit',
                        EDIT_PAGES.EDIT_VIDEO,
                        EDIT_PAGES.EDIT_TRANSCRIPT,
                        EDIT_PAGES.PUBLISH,
                    ]}
                    setSelected={handleEditClick}
                />
            )
        } else return null
    }

    const performGlobalSearch = (s) => {
        history.push(`/search/${s}`)
    }
    let _key = 0
    let { tempResourceUrl: mediaUrl } = recording
    mediaUrl = mediaUrl.substring(mediaUrl.indexOf('recordings/'))
    const studioUrl = process.env.REACT_APP_STUDIO_URL
    mediaUrl = `${studioUrl}/static/${mediaUrl}`
    return (
        <>
            <RecordingSearch
                query={query}
                performSearch={performSearch}
                performGlobalSearch={performGlobalSearch}
                speakers={speakers}
            />
            <FlexContainerCentered id="Recording" stretch={true}>
                <VerticalLayout id="LeftPanel">
                    <AVFile
                        jump={jump}
                        jumpTo={jumpTo}
                        setSeek={setSeek}
                        highlights={highlights}
                        currentCaption={currentCaption}
                        imageAndSoundCaptions={imageAndSoundCaptions}
                        path={mediaUrl}
                    />
                </VerticalLayout>
                <VerticalLayout
                    id="RightPanel"
                    className={cx('recordingVerticalLayout', mediaType)}
                >
                    <div style={{ display: 'flex', width: '100%' }}>
                        <Title
                            small
                            text={recording.title}
                            query={query}
                            style={{ marginLeft: 0 }}
                        />
                        <div className="ml-auto">
                            <EditButton id={id} />
                        </div>
                    </div>
                    {recording.description.length > 0 && (
                        <Para query={query} text={recording.description} />
                    )}
                    {currentPage === EDIT_PAGES.EDIT_TRANSCRIPT ? (
                        <div className="mt-5 w-100">
                            <TranscriptEditor
                                fileName={fileName}
                                jumpTo={jumpTo}
                                transcriptData={transcriptData}
                                setTranscriptData={setTranscriptData}
                            />
                        </div>
                    ) : (
                        <>
                            {tags.length > 0 && (
                                <FlexWrap className="recordingTagsContainer">
                                    Tags:
                                    {tags.splice(0, 15).map((tag) => (
                                        <Tag
                                            queryWords={
                                                query ? query.split(' ') : null
                                            }
                                            onClick={() => performSearch(tag)}
                                            key={_key++}
                                            name={tag}
                                        />
                                    ))}
                                </FlexWrap>
                            )}
                            {recording.speakers.length > 0 && (
                                <FlexWrap className="recordingTagsContainer">
                                    Speakers:
                                    {recording.speakers.map((s) => (
                                        <Tag
                                            queryWords={
                                                query ? query.split(' ') : null
                                            }
                                            onClick={() =>
                                                performSearch(`speaker:${s}`)
                                            }
                                            key={_key++}
                                            name={s}
                                        />
                                    ))}
                                </FlexWrap>
                            )}
                            {topWords.length > 0 && (
                                <FlexWrap className="recordingTagsContainer">
                                    Top Words:
                                    {topWords.map((t) => (
                                        <Tag
                                            onClick={() => performSearch(t[0])}
                                            key={_key++}
                                            name={t[0]}
                                        />
                                    ))}
                                </FlexWrap>
                            )}
                            <Transcript
                                query={query}
                                seek={seek}
                                jumpTo={jumpTo}
                                highlights={highlights}
                                setHighlight={setHighlight}
                                updateCurrentCaption={setCurrentCaption}
                                updateImageAndSoundCaptions={
                                    setImageAndSoundCaptions
                                }
                                defaultTranscript={recording._defaultTranscript}
                                defaultImageCaption={
                                    recording._defaultImageCaption
                                }
                                defaultSoundCaption={
                                    recording._defaultSoundCaption
                                }
                                transcriptId={transcriptId}
                                transcripts={recording._transcripts}
                                imageCaptions={recording._imageCaptions}
                                soundCaptions={recording._soundCaptions}
                                recordingId={id}
                                setSpeakers={setSpeakers}
                                setTopWords={setTopWords}
                            />
                        </>
                    )}
                </VerticalLayout>
            </FlexContainerCentered>
            <div className="p-2">
                {currentPage === EDIT_PAGES.EDIT_TRANSCRIPT &&
                    transcriptData && (
                        <Timeline
                            mediaUrl={mediaUrl}
                            jump={jump}
                            jumpTo={jumpTo}
                            duration={recording.duration}
                            segments={transcriptData.AudioDoc.SegmentList}
                        />
                    )}
            </div>
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
    const { id, query, transcriptId } = useParams()
    if (id == null) return null
    return (
        <Suspense
            SuccessDisplay={Recording}
            successProps={{ query, id, transcriptId }}
            method="getOne"
            _key={id}
            params={['recordings', { id, transcriptId }]}
        />
    )
}

export default RecordingRenderer
