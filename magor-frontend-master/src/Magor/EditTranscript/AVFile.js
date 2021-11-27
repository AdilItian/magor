import React, { useEffect, useState, useRef } from 'react'
import mime from 'mime-types'
import './AVFile.css'

import { IconSelect } from '../Components/'
import cx from '../Utils/cx'
import translate from '../translationProvider'

const AVFile = (props) => {
    const { jump, jumpTo, path: mediaUrl } = props
    const [media, setMedia] = useState(undefined)
    const [seek, setSeekLocal] = useState(0)
    const [isPlaying, setIsPlaying] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const containerRef = useRef()

    useEffect(() => {
        if (media && jump) {
            media.currentTime = jump / 1000
            setSeek(jump)
            jumpTo(null)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [jump])

    // const mediaUrl = `${process.env.REACT_APP_APIURL}/static/recordings/${
    //     props.path.match(/[^/]*$/)[0]
    // }`
    // const mediaType = mime.lookup(props.path).split('/')[0]
    const mediaType = 'video'

    const setSeek = (_) => {
        const s = media.currentTime || 0
        const ms = s * 1000
        setSeekLocal(ms)
        props.setSeek(ms)
    }

    return (
        <div id="AVFileContainer" ref={containerRef}>
            <div
                className="isLoading"
                is-loading={isLoading ? 'yes' : 'no'}
                style={{
                    top: media ? media.offsetTop + 3 : 0,
                    left: media ? media.offsetLeft + 3 : 0,
                    width: media ? media.clientWidth : 0,
                    height: media ? media.clientHeight : 0,
                }}
            />
            <video
                id="AVPlayerElement"
                className={mediaType}
                onPlay={(_) => setIsPlaying(true)}
                onPause={(_) => setIsPlaying(false)}
                onSeeked={setSeek}
                onLoadedData={(e) => setMedia(e.target)}
                onWaiting={() => setIsLoading(true)}
                onPlaying={() => setIsLoading(false)}
                onTimeUpdate={setSeek}
            >
                <source src={mediaUrl} crossOrigin="true"></source>
            </video>
            <MediaPlayer
                containerRef={containerRef}
                seek={seek}
                className={mediaType}
                currentCaption={props.currentCaption}
                imageAndSoundCaptions={props.imageAndSoundCaptions}
                isPlaying={isPlaying}
                highlights={props.highlights}
                media={media}
            />
        </div>
    )
}

const sToTimeString = (s) => {
    let x = parseInt(s)
    const ss = String(x % 60).padStart(2, '0')
    x = parseInt(x / 60)
    const mm = x % 60
    x = parseInt(x / 60)
    const hh = x
    return hh ? `${hh}:${mm}:${ss}` : `${mm}:${ss}`
}

const MediaPlayer = (props) => {
    const { media, seek, isPlaying, className } = props
    const [showCC, setCC] = useState(true)
    const [currentCaptions, setCurrentCaptions] = useState([])
    const [imageAndSoundCaptions, setImageAndSoundCaptions] = useState([])
    const [translationLanguage, setTranslationLanguage] = useState('NONE')

    useEffect(
        (_) => {
            if (!props.currentCaption) return
            const {
                previousCaption = { text: null },
                currentCaption,
                nextCaption = { text: null },
            } = props.currentCaption
            if (translationLanguage === 'NONE') {
                setCurrentCaptions([
                    previousCaption && previousCaption.text,
                    currentCaption ? currentCaption.text : '...',
                    nextCaption && nextCaption.text,
                ])
            } else {
                translate(
                    [
                        previousCaption.text,
                        currentCaption.text,
                        nextCaption.text,
                    ],
                    setCurrentCaptions,
                    translationLanguage
                )
            }
        },
        // eslint-disable-next-line
        [props.currentCaption]
    )
    useEffect(
        () => {
            const { imageAndSoundCaptions = [] } = props
            if (translationLanguage === 'NONE') {
                setImageAndSoundCaptions(
                    imageAndSoundCaptions.map((c) => c.text)
                )
            } else {
                translate(
                    imageAndSoundCaptions.map((c) => c.text),
                    setImageAndSoundCaptions,
                    translationLanguage
                )
            }
        },
        // eslint-disable-next-line
        [props.imageAndSoundCaptions]
    )

    const seekToMs = (ms) => (media.currentTime = ms / 1000)

    const highlightNextPrev = (next = true) => {
        const order = next ? 1 : -1 // 1 for next, -1 for previous
        const sorted = props.highlights
            .map((h) => h.s)
            .sort(
                // sort by start time
                (a, b) => order * (a - b)
            )
        let match,
            found = false
        for (let s of sorted) {
            match = s
            if (order * match > order * seek) {
                // found next/previous in correct direction
                if (!next) {
                    // if we are finding the previous match
                    if (seek - match < 750) continue // have a buffer so we don't keep rematching the same match
                    if (match === props.currentCaption.currentCaption.startTime)
                        continue // don't rematch the current match
                }
                found = true
                break
            }
        }
        if (found) seekToMs(match)
    }

    const seekS = seek / 1000
    if (!media) return null
    const seekPercentage = (seekS * 100) / media.duration
    const getPerc = (s) => `${(0.1 * s) / media.duration}%`
    const togglePlay = (_) => {
        if (isPlaying) media.pause()
        else media.play()
    }
    const volumePercentage = media.volume * 100
    const changeVolFrac = (vf, saveLastMedia = false) => {
        media.lastVolume = media.volume
        media.volume = vf
    }
    const seekMediaFrac = (sf) => {
        media.currentTime = sf * media.duration
    }
    const calcClickFrac = (e, target) => {
        const actualTarget = target
            ? document.querySelector(target)
            : e.currentTarget
        const clickPerc =
            (e.clientX - actualTarget.getBoundingClientRect().left) /
            actualTarget.clientWidth
        if (clickPerc < 0) return 0
        if (clickPerc > 1) return 1
        return clickPerc
    }
    const handleOnMuteUnmute = (lastVolume) => {
        if (media.volume === 0) {
            changeVolFrac(media.lastVolume || 1)
        } else {
            changeVolFrac(0)
        }
    }
    const highlights = props.highlights.map((h) => (
        <div
            key={`${h.s}_${h.d}`}
            data-tag={Array.from(h.w).join(', ')}
            className="mediaHighlight"
            style={{
                left: getPerc(h.s),
                width: getPerc(h.d),
                zIndex: Math.ceil(1 / parseFloat(getPerc(h.d))),
            }}
            onClick={(e) => {
                seekToMs(h.s)
                e.stopPropagation()
            }}
        />
    ))
    return (
        <div id="mediaPlayerContainer" className={className}>
            <div
                id="imageAndSoundCaptionContainer"
                className={showCC ? 'shown' : 'hidden'}
            >
                {imageAndSoundCaptions.map((c) => (
                    <label>[{c}]</label>
                ))}
            </div>
            <div
                id="currentCaptionContainer"
                className={showCC ? 'shown' : 'hidden'}
            >
                <div id="mediaPlayerMatches">
                    <label>{props.highlights.length} matches</label>
                    <div id="mediaPlayerNextPrevMatch">
                        <div
                            className="mediaPlayerButtonContainer"
                            onClick={() => highlightNextPrev(false)}
                        >
                            <div
                                id="mediaPlayerPrevMatch"
                                className="mediaPlayerButton"
                            />
                        </div>
                        <div
                            className="mediaPlayerButtonContainer"
                            onClick={() => highlightNextPrev()}
                        >
                            <div
                                id="mediaPlayerNextMatch"
                                className="mediaPlayerButton"
                            />
                        </div>
                    </div>
                </div>
                <div id="mediaPlayerCCContainer">
                    {currentCaptions.length === 0 ? (
                        <label>Nothing is playing right now.</label>
                    ) : (
                        currentCaptions.map((cc) =>
                            cc ? (
                                <label key={cc}>{cc}</label>
                            ) : (
                                <label key="empty" />
                            )
                        )
                    )}
                </div>
                <IconSelect
                    iconUrl="/translate.svg"
                    onChange={setTranslationLanguage}
                    value={translationLanguage}
                    list={['NONE', 'EN', 'CN', 'MS', 'TA']}
                />
            </div>
            <div id="mediaPlayer">
                <div
                    className="mediaPlayerButtonContainer"
                    onClick={togglePlay}
                >
                    <div
                        id="mediaPlayerPlay"
                        className={cx({
                            mediaPlayerButton: true,
                            pause: isPlaying,
                        })}
                    />
                </div>
                <div
                    className="mediaPlayerButtonContainer"
                    onClick={() => setCC(!showCC)}
                >
                    <div
                        id="mediaPlayerCC"
                        className={cx({
                            mediaPlayerButton: true,
                            hidden: !showCC,
                        })}
                    />
                </div>
                {document.fullscreenEnabled && (
                    <div
                        className="mediaPlayerButtonContainer"
                        onClick={() => {
                            document.fullscreenElement
                                ? document.exitFullscreen()
                                : props.containerRef.current.requestFullscreen()
                        }}
                    >
                        <div
                            id="mediaPlayerFullscreen"
                            className={cx({
                                mediaPlayerButton: true,
                            })}
                        />
                    </div>
                )}
                <label id="mediaPlayerTimestamp">
                    {sToTimeString(seekS)} / {sToTimeString(media.duration)}
                </label>
                <div
                    id="mediaPlayerProgressBarContainer"
                    onClick={(e) =>
                        seekMediaFrac(
                            calcClickFrac(e, '#mediaPlayerProgressBar')
                        )
                    }
                >
                    <div id="mediaPlayerProgressBar">
                        <div
                            id="mediaPlayerProgressBarFilled"
                            style={{ width: `${seekPercentage}%` }}
                        />
                        <div
                            id="mediaPlayerProgressBarSeek"
                            style={{ left: `${seekPercentage}%` }}
                        />
                        {highlights}
                    </div>
                </div>
                <div id="mediaPlayerVolumeContainer">
                    <div id="mediaPlayerVolume">
                        <div
                            id="mediaPlayerVolumeBarContainer"
                            onClick={(e) =>
                                changeVolFrac(
                                    calcClickFrac(e, '#mediaPlayerVolumeBar')
                                )
                            }
                        >
                            <div id="mediaPlayerVolumeBar">
                                <div
                                    id="mediaPlayerVolumeBarFilled"
                                    style={{ width: `${volumePercentage}%` }}
                                />
                                <div
                                    id="mediaPlayerVolumeBarSeek"
                                    style={{ left: `${volumePercentage}%` }}
                                />
                            </div>
                        </div>
                        <div
                            id="mediaPlayerVolumeIcon"
                            className={volumePercentage ? 'hasMedia' : 'muted'}
                            onClick={handleOnMuteUnmute}
                        />
                    </div>
                </div>
            </div>
        </div>
    )
}

export default AVFile
