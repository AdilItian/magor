import React, { useEffect, useState } from 'react'
import './Timeline.css'
import moment from 'moment'

const Indicator = () => {
    return <div className="indicator"></div>
}

const Timeline = ({ segments, duration, jumpTo, jump }) => {
    const interval = 60

    const [indicatorPos, setIndicatorPos] = useState(20)

    const handleJump = (time) => {
        jumpTo(time * 1000)
    }

    useEffect(() => {
        if (jump) {
            setIndicatorPos(jump + 100)
        }
    }, [jump])

    console.log('indi', indicatorPos)
    console.log('indicator', (85380 / 1000 / interval) * 15 + 0.9 + 20)

    return (
        <div className="main-wrapper">
            <div className="timeline-container">
                <div
                    className="indicator-handler"
                    style={{
                        left: `${
                            (indicatorPos / 1000 / interval) * 15 + 0.9 + 20
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
                        { length: duration / interval + 1 },
                        (v, k) => k
                    ).map((m) => (
                        <label>
                            {moment.utc(interval * m * 1000).format('HH:mm:ss')}
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
                                            moment(ss.$.dur * 1000).format('ss')
                                        ) /
                                            interval) *
                                            15 +
                                        0.9
                                    }rem`,
                                }}
                            >
                                {ss.Word.map((w, wIndex) => (
                                    <span key={wIndex.toString()}>{w._}</span>
                                ))}
                            </p>
                        ))
                    )}
                </div>
            </div>
        </div>
    )
}

export default Timeline
