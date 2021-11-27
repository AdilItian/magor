import React, { useState, useRef } from 'react'

import pauseSvg from '../../assets/icons/pause.svg'
import playSvg from '../../assets/icons/play.svg'
import muteSvg from '../../assets/icons/mute.svg'
import volumeSvg from '../../assets/icons/volume.svg'

export default (props) => {
    const { mode, src } = props

    const previewRef = useRef(null)
    const [isVideoPlaying, setVideoPlaying] = useState(false)
    const [isAudioOn, setAudioOn] = useState(false)

    const toggleAudio = () => setAudioOn(!isAudioOn)

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
        <div className="d-flex flex-column align-items-center">
            {/*TODO audio preview*/}
            {mode === 'url' ? (
                <video width="400" muted={!isAudioOn} ref={previewRef}>
                    <source src={src} />
                    Your browser does not support HTML5 video.
                </video>
            ) : (
                <video width="400" muted={!isAudioOn} ref={previewRef}>
                    <source src={URL.createObjectURL(src)} />
                    Your browser does not support HTML5 video.
                </video>
            )}
            <div className="card py-1 px-3 d-flex mt-4 flex-row justify-content-center">
                <div
                    className="mr-3"
                    style={{ cursor: 'pointer' }}
                    onClick={togglePreviewPlay}
                >
                    {isVideoPlaying ? (
                        <img src={pauseSvg} height="30" alt="pause" />
                    ) : (
                        <img src={playSvg} height="30" alt="play" />
                    )}
                </div>
                <div onClick={toggleAudio} style={{ cursor: 'pointer' }}>
                    {isAudioOn ? (
                        <img src={volumeSvg} height="30" alt="volume" />
                    ) : (
                        <img src={muteSvg} height="30" alt="mute" />
                    )}
                </div>
            </div>
        </div>
    )
}
