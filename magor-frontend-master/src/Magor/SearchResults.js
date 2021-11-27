import React, { useState } from 'react'
import { useParams, useHistory } from 'react-router-dom'
import moment from 'moment'
import mime from 'mime-types'

import {
    Suspense,
    SearchBar,
    SearchButton,
    Title,
    Tag,
    BlockLink,
    Para,
    DropDown,
    LabelledInput,
} from './Components/'
import { VerticalLayout, FlexWrap } from './Components/'
import { UserDropdown } from './Components/AuthElements'

import cx from './Utils/cx'
import { QueryParams, queryParamNames } from './Utils/queryParams'
import captionsQueryBuilder from './Utils/captionsQueryBuilder'

import './searchResults.css'

const { TEXT, IMAGE, SOUND, SPEAKER, TAG } = queryParamNames

const buildQuery = (text = '', image, sound, speaker, tag) => {
    let q = text
    if (image !== '') q += ` image:${image}`
    if (sound !== '') q += ` sound:${sound}`
    if (speaker !== '') q += ` speaker:${speaker}`
    if (tag !== '') q += ` tag:${tag}`
    return q
}

const SearchResults = (props) => {
    const { query } = useParams()
    const history = useHistory()
    const queryParams = new QueryParams(query)
    const [newQuery, setNewQuery] = useState(queryParams.getParam(TEXT) || '')
    const [newQueryImage, setNewQueryImage] = useState(
        queryParams.getParam(IMAGE) || ''
    )
    const [newQuerySound, setNewQuerySound] = useState(
        queryParams.getParam(SOUND) || ''
    )
    const [newQuerySpeaker, setNewQuerySpeaker] = useState(
        queryParams.getParam(SPEAKER) || ''
    )
    const [newQueryTag, setNewQueryTag] = useState(
        queryParams.getParam(TAG) || ''
    )
    const [page, setPage] = useState(1)
    const [sort, setSort] = useState('createdAt')
    const [order, setOrder] = useState('descending')
    const performSearch = () => {
        document.title = newQuery.length > 0 ? newQuery + ' - Magor' : 'Magor'
        history.push(
            `/search/${buildQuery(
                newQuery,
                newQueryImage,
                newQuerySound,
                newQuerySpeaker,
                newQueryTag
            )}`
        )
    }

    useState(() => {
        document.title = newQuery.length > 0 ? newQuery + ' - Magor' : 'Magor'
    }, [newQuery])
    // the line below only controls what results to load... it has nothing to do with search
    const { method, text, fields } = captionsQueryBuilder(query)
    return (
        <VerticalLayout id="SearchResults" style={{ padding: 10 }}>
            <div style={{ display: 'flex', position: 'relative' }}>
                <Title
                    small
                    thin
                    text="Magor"
                    onClick={(_) => history.push('/')}
                />
                <SearchBar
                    small
                    performSearch={performSearch}
                    value={newQuery}
                    handleChange={setNewQuery}
                />
                <SearchButton small performSearch={performSearch} />
            </div>
            <div className="additionalInputsContainer">
                <LabelledInput
                    label="Search by Image"
                    labelShown={true}
                    value={newQueryImage}
                    setValue={setNewQueryImage}
                />
                <LabelledInput
                    label="Search by Sound"
                    labelShown={true}
                    value={newQuerySound}
                    setValue={setNewQuerySound}
                />
                <LabelledInput
                    label="Search by Speaker"
                    labelShown={true}
                    value={newQuerySpeaker}
                    setValue={setNewQuerySpeaker}
                />
                <LabelledInput
                    label="Search by Tag"
                    labelShown={true}
                    value={newQueryTag}
                    setValue={setNewQueryTag}
                />
            </div>
            <UserDropdown />
            <VerticalLayout style={{ padding: 20 }}>
                <Suspense
                    SuccessDisplay={Results}
                    successProps={{
                        query,
                        setPage,
                        sort,
                        setSort,
                        order,
                        setOrder,
                    }}
                    method={method}
                    _key={query + page + sort + order}
                    params={['recordings', text, 10, page, sort, order, fields]}
                />
            </VerticalLayout>
        </VerticalLayout>
    )
}

const Results = ({
    data: results,
    query,
    setPage,
    sort,
    setSort,
    order,
    setOrder,
}) => {
    const recordings = results.data
    const meta = results.meta
    let _key = 0
    const next = (_) => meta.hasNextPage && setPage(meta.page + 1)
    const prev = (_) => meta.hasPrevPage && setPage(meta.page - 1)
    const start = (meta.page - 1) * meta.limit + 1
    const end = start + recordings.length - 1
    return (
        <VerticalLayout style={{ width: '100%' }}>
            {recordings.length === 0 ? (
                <p>No results found</p>
            ) : (
                <div id="SearchMeta">
                    <div>
                        <label
                            className={cx({
                                nextPrevPage: true,
                                active: meta.hasPrevPage,
                            })}
                            onClick={prev}
                        >
                            {'< Prev '}
                        </label>
                        Showing {start} to {end} of {results.total} result(s)
                        <label
                            className={cx({
                                nextPrevPage: true,
                                active: meta.hasNextPage,
                            })}
                            onClick={next}
                        >
                            {' Next >'}
                        </label>
                    </div>
                    <div id="DropDownsContainer">
                        Sort by{' '}
                        <DropDown
                            white
                            list={['createdAt', 'title']}
                            selected={sort}
                            setSelected={setSort}
                        />{' '}
                        Order{' '}
                        <DropDown
                            white
                            list={['ascending', 'descending']}
                            selected={order}
                            setSelected={setOrder}
                            _key="key"
                        />
                    </div>
                </div>
            )}
            {recordings.map((recording) => (
                <Recording key={_key++} query={query} recording={recording} />
            ))}
        </VerticalLayout>
    )
}

const secondsToTimeStamp = (s) => {
    const sec = Math.floor(s)
    const min = Math.floor(s / 60)
    const hrs = Math.floor(min / 60)
    const ss = String(sec % 60).padStart(2, '0')
    const mm = String(min % 60).padStart(2, '0')
    const hh = hrs > 0 ? String(hrs % 60).padStart(2, '0') : null
    return `${hh ? `${hh}:` : ''}${mm}:${ss}`
}

const Recording = (props) => {
    const { recording, query = '' } = props
    const {
        title,
        description,
        tags,
        id,
        relevantSegments,
        createdAt,
        path,
        transcripts,
        thumbnailPath,
        duration,
    } = recording
    const firstTenTags = tags.slice(0, 10)
    // const [recType, recFormat] = mime.lookup(path).split('/')
    const [recType, recFormat] = ['video', 'srt']
    // const transcriptType = transcripts[0].path.match(/[^/.]*$/)[0]
    const transcriptType = 'speech'
    const queryWords = query.replace(/(image:|sound:)/g, '').split(' ')
    let _key = 0
    return (
        <BlockLink
            className="searchResult"
            href={`/recording/${id}/${query}`}
            style={{ borderRadius: 10 }}
        >
            <div className="searchResultThumbnailMeta">
                <div
                    className="searchResultThumbnail"
                    style={{
                        backgroundImage: `url(${
                            process.env.REACT_APP_STUDIO_URL
                        }/static/images/${thumbnailPath.match(/[^/]*$/)[0]})`,
                    }}
                >
                    <label className="searchResultDuration">
                        {secondsToTimeStamp(duration)}
                    </label>
                </div>
                <div className="searchResultDetails">
                    <Title
                        small
                        thin
                        text={title}
                        query={queryWords.join(' ')}
                        style={{ marginLeft: 0 }}
                    />
                    <Para
                        query={queryWords.join(' ')}
                        text={description || 'No Description'}
                        className="recordingDescription"
                    />
                    <p>
                        <label
                            className="searchResultDescriptor blue"
                            title={Date(createdAt)}
                        >
                            {moment(createdAt).fromNow()}
                        </label>
                        <label
                            className="searchResultDescriptor red"
                            title="Recording Type"
                        >
                            {recFormat.toUpperCase() + ' ' + recType}
                        </label>
                        <label
                            className="searchResultDescriptor violet"
                            title="Transcript Type"
                        >
                            {transcriptType.toUpperCase()}
                        </label>
                    </p>
                    {tags.length > 0 && (
                        <FlexWrap style={{ alignItems: 'center' }}>
                            {firstTenTags.map((tag) => (
                                <Tag
                                    key={_key++}
                                    name={tag.tagName}
                                    queryWords={queryWords}
                                />
                            ))}
                            {tags.length > 10 && ` ... ${tags.length} tags`}
                        </FlexWrap>
                    )}
                </div>
            </div>
            <div className="relevantSegments">
                {relevantSegments &&
                    relevantSegments
                        .slice(0, 2)
                        .map((seg) => (
                            <Para
                                query={queryWords.join(' ')}
                                key={seg.slice(10)}
                                text={seg}
                            />
                        ))}
            </div>
        </BlockLink>
    )
}

export default SearchResults
