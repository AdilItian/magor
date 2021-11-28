import React, { useEffect, useState } from 'react'
import './Timeline.css'
import moment from 'moment'
import { FlexWrap } from '../Components'
import { FaUndo, FaRedo } from 'react-icons/fa'

const Indicator = () => {
    return <div className="indicator"></div>
}

const Timeline = ({ segments, duration, jumpTo, jump, mediaUrl }) => {
    const interval = 60
    const [zoom, setZoom] = useState(10)
    const [indicatorPos, setIndicatorPos] = useState(20)
    const MIN_ZOOM = 5
    const MAX_ZOOM = 25
    const handleJump = (time) => {
        jumpTo(time * 1000)
    }

    useEffect(() => {
        if (jump) {
            setIndicatorPos(jump + 100)
        }
    }, [jump])

    const Time = ({ time }) => {
        return (
            <div className="timeline-timebox">
                {moment.utc(time * 1000).format('HH:mm:ss')}
            </div>
        )
    }

    const UndoButton = () => {
        return (
            <div className="timeline-button">
                <FaUndo /> UNDO
            </div>
        )
    }

    const RedoButton = () => {
        return (
            <div className="timeline-button">
                <FaRedo /> REDO
            </div>
        )
    }
    const ZoomInButton = () => {
        const handleZoomIn = () => {
            setZoom((prevState) => {
                if (prevState === MAX_ZOOM) {
                    return prevState
                } else {
                    return prevState + 5
                }
            })
        }
        return (
            <div
                onClick={handleZoomIn}
                className={`timeline-button ${
                    zoom === MAX_ZOOM ? 'disabled' : ''
                }`}
            >
                <svg
                    width="24"
                    height="24"
                    xmlns="http://www.w3.org/2000/svg"
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                >
                    <path d="M15.853 16.56c-1.683 1.517-3.911 2.44-6.353 2.44-5.243 0-9.5-4.257-9.5-9.5s4.257-9.5 9.5-9.5 9.5 4.257 9.5 9.5c0 2.442-.923 4.67-2.44 6.353l7.44 7.44-.707.707-7.44-7.44zm-6.353-15.56c4.691 0 8.5 3.809 8.5 8.5s-3.809 8.5-8.5 8.5-8.5-3.809-8.5-8.5 3.809-8.5 8.5-8.5zm-4.5 8h4v-4h1v4h4v1h-4v4h-1v-4h-4v-1z" />
                </svg>
            </div>
        )
    }

    const ZoomOutButton = () => {
        const handleZoomOut = () => {
            setZoom((prevState) => {
                if (prevState === MIN_ZOOM) {
                    return prevState
                } else {
                    return prevState - 5
                }
            })
        }
        return (
            <div
                className={`timeline-button ${
                    zoom === MIN_ZOOM ? 'disabled' : ''
                }`}
                onClick={handleZoomOut}
            >
                <svg
                    width="24"
                    height="24"
                    xmlns="http://www.w3.org/2000/svg"
                    fill-rule="evenodd"
                    clip-rule="evenodd"
                >
                    <path d="M15.853 16.56c-1.683 1.517-3.911 2.44-6.353 2.44-5.243 0-9.5-4.257-9.5-9.5s4.257-9.5 9.5-9.5 9.5 4.257 9.5 9.5c0 2.442-.923 4.67-2.44 6.353l7.44 7.44-.707.707-7.44-7.44zm-6.353-15.56c4.691 0 8.5 3.809 8.5 8.5s-3.809 8.5-8.5 8.5-8.5-3.809-8.5-8.5 3.809-8.5 8.5-8.5zm-4.5 8h9v1h-9v-1z" />
                </svg>
            </div>
        )
    }

    const ZoomSlider = () => {
        return (
            <div>
                <input
                    disabled
                    min={MIN_ZOOM}
                    max={MAX_ZOOM}
                    value={zoom}
                    type="range"
                />
            </div>
        )
    }

    const getInterval = () => {
        return (interval / zoom) * MIN_ZOOM
    }

    return (
        <div>
            <FlexWrap className="px-3 mb-3" style={{ alignItems: 'center' }}>
                <FlexWrap
                    style={{
                        flex: '1',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                    }}
                >
                    <Time time={indicatorPos / 1000} />
                    <UndoButton />
                    <RedoButton />
                </FlexWrap>
                <FlexWrap
                    style={{
                        flex: '2',
                        justifyContent: 'flex-end',
                        gap: '1rem',
                    }}
                >
                    <ZoomOutButton />
                    <ZoomSlider />
                    <ZoomInButton />
                </FlexWrap>
            </FlexWrap>
            <div className="main-wrapper">
                <div className="timeline-container">
                    <div
                        className="indicator-handler"
                        style={{
                            left: `${
                                (indicatorPos / 1000 / getInterval()) * 15 +
                                0.9 +
                                20
                            }rem`,
                        }}
                    >
                        <Indicator />
                    </div>
                    <img
                        src="https://img.icons8.com/android/50/000000/musical.png"
                        className="icon-music"
                    />
                    <div className="icon-content"></div>
                    <div className="top"></div>
                    <div className="time-labels">
                        {Array.from(
                            { length: duration / getInterval() + 1 },
                            (v, k) => k
                        ).map((m) => (
                            <label>
                                {moment
                                    .utc(getInterval() * m * 1000)
                                    .format('HH:mm:ss')}
                            </label>
                        ))}
                    </div>
                    <div className="time-contents">
                        {segments.map((sl, slIndex) =>
                            sl.SpeechSegment.map((ss, ssIndex) => (
                                <p
                                    onClick={() => handleJump(ss.$.stime)}
                                    key={slIndex.toString()}
                                    style={{
                                        width: `${
                                            (Number(
                                                moment(ss.$.dur * 1000).format(
                                                    'ss'
                                                )
                                            ) /
                                                interval) *
                                            (17.25 * (zoom / MIN_ZOOM))
                                        }rem`,
                                    }}
                                >
                                    {ss.Word.map((w, wIndex) => (
                                        <span key={wIndex.toString()}>
                                            {w._}
                                        </span>
                                    ))}
                                </p>
                            ))
                        )}
                    </div>
                    <div className="audio-spectrum"></div>
                </div>
            </div>
        </div>
    )
}

export default Timeline
