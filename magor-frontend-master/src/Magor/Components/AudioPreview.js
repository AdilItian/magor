import React, { useState, useRef } from 'react'

import pauseSvg from '../../assets/icons/pause.svg'
import playSvg from '../../assets/icons/play.svg'
import Waveform from '../../assets/waveform.jpg'

export default (props) => {
    const { mode, src } = props

    const previewRef = useRef(null)
    const [isVideoPlaying, setVideoPlaying] = useState(false)

    const togglePreviewPlay = () => {
        const next = !isVideoPlaying
        setVideoPlaying(next)
        if (next) {
            previewRef.current.play()
        } else {
            previewRef.current.pause()
        }
    }

    return (
        <div
            className="d-flex flex-column align-items-center"
            style={{ width: '100%' }}
        >
            <img src={Waveform} height="200" alt="Audio file" />
            {mode === 'url' ? (
                <audio ref={previewRef}>
                    <source src={src} />
                    Your browser does not support HTML5 audio.
                </audio>
            ) : (
                <audio ref={previewRef}>
                    <source src={URL.createObjectURL(src)} />
                    Your browser does not support HTML5 audio.
                </audio>
            )}
            <div className="card py-1 px-3 mt-2 d-flex flex-row justify-content-center">
                <div style={{ cursor: 'pointer' }} onClick={togglePreviewPlay}>
                    {isVideoPlaying ? (
                        <img src={pauseSvg} height="30" alt="pause" />
                    ) : (
                        <img src={playSvg} height="30" alt="play" />
                    )}
                </div>
            </div>
        </div>
    )
}
