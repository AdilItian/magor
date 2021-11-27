import React, { useEffect, useState, useCallback } from 'react'

import { DropDown, Button } from '../Components/'
import Timeline from '../timeline'
import shouldHighlight from '../Utils/shouldHighlight'
import transcriptProvider from '../transcriptProvider'
import captionsQueryBuilder from '../Utils/captionsQueryBuilder'
import { QueryParams } from '../Utils/queryParams'
import getEmotion from '../Utils/getEmotion'
import cx from '../Utils/cx'
import _ from 'lodash'

import './Transcript.css'

let timeline
let currentCaption = null
let captionIndex = {}
let speakerColorsStyleSheet = document.createElement('style')
document.head.appendChild(speakerColorsStyleSheet)
let isProgrammaticScrollEvent = false
let enableAutoScrollTimer

const generateRandomColors = (speakers) => {
    const num = speakers.length
    if (num === 0) return
    while (speakerColorsStyleSheet.sheet.rules.length !== 0) {
        speakerColorsStyleSheet.sheet.removeRule(0)
    }
    const usedColors = []
    const allowedSatValues = ['80%', '90%', '100%']
    for (let i = 0; i < num; ) {
        const h = Math.floor(Math.random() * 36) * 10
        const s = allowedSatValues[Math.min(2, Math.floor(Math.random() * 3))]
        const l = '50%'
        const hsl = `hsl(${h}, ${s}, ${l})`
        if (usedColors.indexOf(hsl) === -1) {
            usedColors.push(hsl)
            speakerColorsStyleSheet.sheet.insertRule(
                `.speaker_${speakers[i]} {background: ${hsl}}`
            )
            i++
        }
    }
}

const seekToAndStyle = (
    seek,
    updateCurrentCaption,
    updateImageAndSoundCaptions,
    shouldAutoScroll
) => {
    const diff = timeline.seekToAndGetDiff(seek)
    let d,
        para,
        captionChanged = false
    const keys = Object.keys(captionIndex)
    let previousCaption, nextCaption
    let currentCaptionIndex
    for (d in diff) {
        para = document.querySelector(`[data-id="${d}"]`)
        currentCaption = captionIndex[d]
        if (diff[d] === -1) {
            para.className = ''
            if (currentCaption.isImageOrSoundCaption) {
                const id = d
                updateImageAndSoundCaptions((current) => {
                    return [...current].filter((c) => c.id !== id)
                })
            }
        } else if (diff[d] === 1) {
            const cc = currentCaption
            if (currentCaption.isImageOrSoundCaption) {
                updateImageAndSoundCaptions((current) => {
                    return [...current, cc]
                })
            } else {
                currentCaptionIndex = keys.indexOf(d)
                previousCaption = captionIndex[keys[currentCaptionIndex - 1]]
                nextCaption = captionIndex[keys[currentCaptionIndex + 1]]
                captionChanged = true
                para.className = 'bold'
                if (shouldAutoScroll) {
                    isProgrammaticScrollEvent = true
                    para.scrollIntoView({ behavior: 'smooth', block: 'center' })
                }
            }
        }
    }
    if (captionChanged)
        updateCurrentCaption({ previousCaption, currentCaption, nextCaption })
}

const Word = React.memo((props) => {
    const { ssidx, idx, word, queryWords, highlightSentence } = props
    console.log(ssidx, idx)
    let modWord = word
    let className
    if (shouldHighlight(word, queryWords)) {
        highlightSentence(word)
        className = 'highlighted'
    }
    if (idx === 1 && ssidx === 0) {
        modWord = _.capitalize(word)
        console.log(modWord)
    }
    return className ? (
        <label className={className} style={{ marginRight: 5 }}>
            {modWord}
        </label>
    ) : (
        `${modWord} `
    )
})

const SpeechSubSegment = (props) => {
    const {
        idx,
        speechSubSegment,
        setHighlight,
        queryWordsDict,
        isImageCaption,
        isSoundCaption,
        query,
    } = props
    const { startTime, endTime, id, words } = speechSubSegment
    console.log('words', words)
    useEffect(
        (_) => {
            timeline.add(startTime, endTime, id)
            captionIndex[id] = {
                id,
                startTime,
                text: words.join(' '),
                endTime,
                isImageOrSoundCaption: isImageCaption || isSoundCaption,
            }
        },
        [endTime, id, startTime, words, isImageCaption, isSoundCaption]
    )
    useEffect(
        (_) => {
            setHighlighted(false)
        },
        [query]
    )
    const [highlighted, setHighlighted] = useState(false)
    const highlightSentence = useCallback(
        (word) => {
            if (highlighted) return
            setHighlighted(true)
            setHighlight(startTime, endTime - startTime, word)
        },
        [highlighted, setHighlight, startTime, endTime]
    )
    let _key = 0
    const { fields = {}, text } = queryWordsDict
    const { uniqueWordsImage, uniqueWordsSound, uniqueWordsSpeech } = fields
    const queryWords = []
    if (uniqueWordsImage && isImageCaption)
        queryWords.push(...uniqueWordsImage.split(' '))
    if (uniqueWordsSound && isSoundCaption)
        queryWords.push(...uniqueWordsSound.split(' '))
    if (uniqueWordsSpeech) queryWords.push(...uniqueWordsSpeech.split(' '))
    if (text) queryWords.push(...text.split(' '))
    return (
        <span
            data-id={id}
            data-role="speechSubSegment"
            style={{ marginRight: '0' }}
        >
            {(isImageCaption || isSoundCaption) && '[ '}
            {words.map((w) => (
                <Word
                    ssidx={idx}
                    key={_key++}
                    idx={_key}
                    word={w}
                    queryWords={queryWords}
                    highlightSentence={highlightSentence}
                />
            ))}
            {(isImageCaption || isSoundCaption) && ']'}
        </span>
    )
}

const DataSegment = (props) => {
    const {
        dataSegment,
        jumpTo,
        setHighlight,
        query,
        queryWordsDict,
        ...otherProps
    } = props
    const {
        startTime,
        speakerId = 'S',
        emotion = null,
        speechSubSegments,
        endTime,
        id,
    } = dataSegment
    const isImageCaption = speakerId === 'imageCaption'
    const isSoundCaption = speakerId === 'soundCaption'
    const dataType =
        isImageCaption || isSoundCaption ? speakerId : 'speechSegment'
    const [highlighted, setHighlighted] = useState(false)
    const highlightSegment = useCallback(
        (word) => {
            if (highlighted) return
            setHighlighted(true)
            setHighlight(startTime, endTime - startTime, word)
        },
        [highlighted, setHighlight, startTime, endTime]
    )
    useEffect(
        (_) => {
            setHighlighted(false)
        },
        [query]
    )
    const speakerQuery = new QueryParams(query).params.SPEAKER
    const doesQueryHaveSpeaker =
        speakerQuery && shouldHighlight(speakerId, speakerQuery.split(' '))
    if (doesQueryHaveSpeaker) {
        highlightSegment(speakerId)
    }
    const doesQueryHaveEmotion =
        emotion &&
        queryWordsDict.fields &&
        queryWordsDict.fields.emotion === emotion.toLowerCase()
    if (doesQueryHaveEmotion) {
        highlightSegment(getEmotion(emotion).name)
    }
    let _idx = 0
    return (
        <div
            data-id={id}
            data-endtime={endTime}
            data-role={dataType}
            onClick={(_) => {
                jumpTo(startTime)
            }}
            className={emotion !== null ? 'hasEmotion' : ''}
        >
            <p style={{ marginBottom: '10px' }}>
                <span>
                    <label
                        className={`speaker speaker_${speakerId.replace(
                            / /g,
                            '_'
                        )} ${highlighted && 'highlight'}`}
                    >
                        {isImageCaption || isSoundCaption ? '**' : speakerId}
                    </label>
                    {emotion && (
                        <span className="emotion">
                            <label style={{ color: getEmotion(emotion).color }}>
                                {getEmotion(emotion).name}
                            </label>
                            <label className="emoji">
                                {getEmotion(emotion).emoji}
                            </label>
                        </span>
                    )}
                </span>
                {speechSubSegments.map((sss) => (
                    <SpeechSubSegment
                        idx={_idx++}
                        key={sss.id}
                        speechSubSegment={sss}
                        isImageCaption={isImageCaption}
                        isSoundCaption={isSoundCaption}
                        setHighlight={setHighlight}
                        query={query}
                        queryWordsDict={queryWordsDict}
                        {...otherProps}
                    />
                ))}
            </p>
        </div>
    )
}

const TranscriptBody = React.memo((props) => {
    const { query = '', dataSegments, className, ...otherProps } = props
    const queryWordsDict = captionsQueryBuilder(query)
    try {
        return (
            <div
                id="transcript"
                style={{ margin: '15px 0' }}
                className={className}
            >
                {dataSegments.map((dataSegment) => (
                    <DataSegment
                        key={dataSegment.id}
                        query={query}
                        queryWordsDict={queryWordsDict}
                        dataSegment={dataSegment}
                        {...otherProps}
                    />
                ))}
            </div>
        )
    } catch (e) {
        console.error(e)
        return <p>Error Parsing Transcript: Invalid JSON Structure</p>
    }
})

const TranscriptRenderer = (props) => {
    const {
        seek,
        updateCurrentCaption,
        updateImageAndSoundCaptions,
        recordingId,
        highlights,
        query = '',
        setSpeakers,
        setTopWords,
        ...otherProps
    } = props

    const [dataSegments, setDataSegments] = useState(null)
    console.log('dataSegments', dataSegments)
    const [error, setError] = useState(null)
    const [showOptions, setShowOptions] = useState(false)

    const transcripts = props.transcripts
    const imageCaptions = props.imageCaptions
    const soundCaptions = props.soundCaptions
    const defaultTranscript = _.find(
        transcripts,
        (tx) => tx._id === props.defaultTranscript
    )

    console.log('defaultTranscript', defaultTranscript)
    const defaultImageCaption = _.find(
        imageCaptions,
        (ic) => ic._id === props.defaultImageCaption
    )
    const defaultSoundCaption = _.find(
        soundCaptions,
        (sc) => sc._id === props.defaultSoundCaption
    )

    const transcriptsPathMap = props.transcripts.map(
        ({ name, path, asrId }) => ({ name: name || path, path, asrId })
    )

    console.log('transcriptsPathMap', transcriptsPathMap)
    const imageCaptionsPathMap = props.imageCaptions.map(
        ({ name, path, asrId }) => ({ name: name || path, path, asrId })
    )
    const soundCaptionsPathMap = props.soundCaptions.map(
        ({ name, path, asrId }) => ({ name: name || path, path, asrId })
    )

    const [transcript, setTranscript] = useState(defaultTranscript)
    const [imageCaption, setImageCaption] = useState(defaultImageCaption)
    const [soundCaption, setSoundCaption] = useState(defaultSoundCaption)
    const [showTx, setShowTx] = useState(true)
    const [showImgCap, setShowImgCap] = useState(true)
    const [showSndCap, setShowSndCap] = useState(true)
    const [shouldAutoScroll, setShouldAutoScroll] = useState(true)

    useEffect(
        (_) => {
            setDataSegments(null)
            setError(null)

            timeline = new Timeline()
            captionIndex = {}

            transcriptProvider(
                transcript,
                imageCaption,
                soundCaption,
                recordingId
            )
                .then(
                    ([
                        speakers,
                        _speechSegments,
                        _soundSegments = [],
                        _imageSegments = [],
                        topWords = [],
                    ]) => {
                        generateRandomColors(speakers)
                        setSpeakers(speakers)
                        setDataSegments(
                            [
                                ..._speechSegments,
                                ..._soundSegments,
                                ..._imageSegments,
                            ].sort((a, b) => a.startTime - b.startTime)
                        )
                        setTopWords(topWords)
                    }
                )
                .catch(setError)
        },
        [
            transcript,
            imageCaption,
            soundCaption,
            recordingId,
            setSpeakers,
            setTopWords,
        ]
    )

    useEffect(
        (_) => {
            seekToAndStyle(
                seek,
                updateCurrentCaption,
                updateImageAndSoundCaptions,
                shouldAutoScroll
            )
        },
        [
            seek,
            updateCurrentCaption,
            updateImageAndSoundCaptions,
            shouldAutoScroll,
        ]
    )

    const enableAutoScroll = () => {
        setShouldAutoScroll(true)
        if (enableAutoScrollTimer) clearTimeout(enableAutoScrollTimer)
    }
    const keepManuallyScrolling = () => {
        setShouldAutoScroll(false)
        if (enableAutoScrollTimer) clearTimeout(enableAutoScrollTimer)
        enableAutoScrollTimer = setTimeout(
            () => setShouldAutoScroll(true),
            1000
        )
    }

    if (dataSegments)
        return (
            <>
                <div style={{ display: showOptions ? 'block' : 'none' }}>
                    <div className="ops selectTranscript">
                        <label>Transcript:</label>
                        <DropDown
                            list={transcripts}
                            _key="name"
                            value="azureResourceUrl"
                            selected={transcript}
                            setSelected={setTranscript}
                            white
                        />
                    </div>
                    {imageCaptionsPathMap.length > 0 && (
                        <div className="ops selectTranscript">
                            <label>Image Caption:</label>
                            <DropDown
                                list={imageCaptionsPathMap}
                                _key="name"
                                value="path"
                                selected={imageCaption}
                                setSelected={setImageCaption}
                                white
                            />
                        </div>
                    )}
                    {soundCaptionsPathMap.length > 0 && (
                        <div className="ops selectTranscript">
                            <label>Sound Caption:</label>
                            <DropDown
                                list={soundCaptionsPathMap}
                                _key="name"
                                value="path"
                                selected={soundCaption}
                                setSelected={setSoundCaption}
                                white
                            />
                        </div>
                    )}
                    <div className="ops transcriptFilters">
                        <label>Filters:</label>
                        <input
                            type="checkbox"
                            onChange={(_) => setShowTx(!showTx)}
                            checked={showTx}
                        />
                        <label>Show Transcript</label>
                        <input
                            type="checkbox"
                            onChange={(_) => setShowImgCap(!showImgCap)}
                            checked={showImgCap}
                        />
                        <label>Show Image Captions</label>
                        <input
                            type="checkbox"
                            onChange={(_) => setShowSndCap(!showSndCap)}
                            checked={showSndCap}
                        />
                        <label>Show Sound Captions</label>
                    </div>
                </div>
                <div id="TranscriptTab">
                    <label>
                        Transcript
                        {query !== '' && (
                            <label className="badge">{highlights.length}</label>
                        )}
                    </label>
                    <button onClick={() => setShowOptions(!showOptions)}>
                        {`${showOptions ? 'Hide' : 'Show'} options`}
                    </button>
                </div>
                <div
                    id="TranscriptRenderer"
                    onScroll={(_) => {
                        if (!isProgrammaticScrollEvent) {
                            keepManuallyScrolling()
                            isProgrammaticScrollEvent = false
                        }
                    }}
                    onWheel={keepManuallyScrolling}
                >
                    <Button
                        small
                        className={cx({
                            autoScroll: true,
                            visible: !shouldAutoScroll,
                        })}
                        onClick={enableAutoScroll}
                    >
                        Enable auto scroll
                    </Button>
                    <TranscriptBody
                        dataSegments={dataSegments}
                        query={query}
                        className={cx({
                            noTx: !showTx,
                            noImgCap: !showImgCap,
                            noSndCap: !showSndCap,
                        })}
                        {...otherProps}
                    />
                </div>
            </>
        )

    if (error)
        return (
            <>
                <div className="ops selectTranscript">
                    <label>Transcript:</label>
                    <DropDown
                        list={transcriptsPathMap}
                        _key="name"
                        value="path"
                        selected={transcript}
                        setSelected={setTranscript}
                        white
                    />
                </div>
                <p>
                    <strong>Error Occured:</strong>
                </p>
                <br />
                {typeof error === 'string' ? (
                    <p>{error}</p>
                ) : (
                    <pre>{JSON.stringify(error, null, 2)}</pre>
                )}
            </>
        )

    return <p>Loading...</p>
}

export default TranscriptRenderer
