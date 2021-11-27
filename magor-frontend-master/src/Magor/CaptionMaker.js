import React, { useState, useRef, useEffect } from 'react'

import { FlexContainerCentered, VerticalLayout, FileInput } from './Components'
import { recordingValidator } from './Utils/uploadInputValidators'
import { NavBar } from './Upload/'

const CaptionMaker = (props) => {
    const [file, setFile] = useState(null)
    const videoRef = useRef()
    useEffect(() => {
        document.title = 'Caption Maker - Magor'
    })
    return (
        <>
            <NavBar currentPath="captionMaker" />
            <FlexContainerCentered>
                <VerticalLayout style={{ flexDirection: 'row' }}>
                    {!file && (
                        <FileInput
                            file={file}
                            setFile={setFile}
                            validator={recordingValidator}
                        />
                    )}
                    {file && (
                        <div>
                            <video
                                style={{ width: 500 }}
                                src={URL.createObjectURL(file)}
                                controls
                                ref={videoRef}
                            />
                            <p>
                                i => new ImageCaption, s => new SoundCaption,
                                Enter => save
                            </p>
                        </div>
                    )}
                    {file && <CaptionMakerPanel videoRef={videoRef} />}
                </VerticalLayout>
            </FlexContainerCentered>
        </>
    )
}

const CaptionMakerPanel = ({ videoRef }) => {
    const [imageCaptions, setImageCaptions] = useState([])
    const [soundCaptions, setSoundCaptions] = useState([])
    const [isImageCaptionMode, setIsImageCaptionMode] = useState(false)
    const [isSoundCaptionMode, setIsSoundCaptionMode] = useState(false)
    const [enteredText, setEnteredText] = useState('')
    const [lastTimeStamp, setLastTimeStamp] = useState(null)
    document.onkeydown = (e) => {
        if (isImageCaptionMode || isSoundCaptionMode) {
            if (e.key.match(/^[a-z0-9!@#$%^&*()-_=+[\]\\{}|;':",./<>? ]$/i)) {
                setEnteredText((prev) => prev + e.key)
            } else if (e.key === 'Backspace') {
                setEnteredText((prev) => prev.slice(0, prev.length - 1))
            } else if (e.key === 'Enter') {
                if (lastTimeStamp !== null) {
                    const s = lastTimeStamp
                    const e = videoRef.current.currentTime
                    const text = enteredText
                    const f = (prev) => [...prev, { s, text, e }]
                    if (isImageCaptionMode) {
                        setImageCaptions(f)
                    } else if (isSoundCaptionMode) {
                        setSoundCaptions(f)
                    }
                    setIsImageCaptionMode(false)
                    setIsSoundCaptionMode(false)
                    setLastTimeStamp(null)
                    setEnteredText('')
                }
            }
        } else {
            switch (e.key) {
                case 'i':
                    setIsImageCaptionMode(true)
                    setLastTimeStamp(videoRef.current.currentTime)
                    break
                case 's':
                    setIsSoundCaptionMode(true)
                    setLastTimeStamp(videoRef.current.currentTime)
                    break
                case 'd':
                    let text = ''
                    text += '<ImageCaptionList>\n'
                    let i
                    for (i of imageCaptions) {
                        text += `\t<ImageSegment stime="${i.s.toFixed(
                            2
                        )}" dur="${(i.e - i.s).toFixed(2)}">${
                            i.text
                        }</ImageSegment>\n`
                    }
                    text += '</ImageCaptionList>\n\n'
                    text += '<SoundCaptionList>\n'
                    let s
                    for (s of soundCaptions) {
                        text += `\t<SoundSegment stime="${s.s.toFixed(
                            2
                        )}" dur="${(s.e - s.s).toFixed(2)}">${
                            s.text
                        }</SoundSegment>\n`
                    }
                    text += '</SoundCaptionList>\n'
                    window.open(`data:text/plain,${text}`)
                    break
                default:
            }
        }
        e.stopPropagation()
    }
    return (
        <div style={{ paddingLeft: 30 }}>
            <p>
                Current mode:{' '}
                {isImageCaptionMode
                    ? 'IMAGE CAPTION'
                    : isSoundCaptionMode
                    ? 'SOUND CAPTION'
                    : 'NORMAL'}
            </p>
            <p>Entered Text: {enteredText}</p>
            <p>Last time stamp: {lastTimeStamp}</p>
            <p>Press e to download</p>
            <div>
                <p>Image:</p>
                {imageCaptions.map((i) => (
                    <p key={`${i.s}_${i.e}`}>{i.text}</p>
                ))}
            </div>
            <div>
                <p>Sound:</p>
                {soundCaptions.map((s) => (
                    <p key={`${s.s}_${s.e}`}>{s.text}</p>
                ))}
            </div>
        </div>
    )
}

export default CaptionMaker
