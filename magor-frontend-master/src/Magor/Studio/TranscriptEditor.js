import React from 'react'
import axios from 'axios'
import xml2js from 'xml2js'
import toast, { Toaster } from 'react-hot-toast'
import moment from 'moment'
import './TranscriptEditor.css'
import { useHistory, Link, useParams } from 'react-router-dom'
import { DropDown, HorizontalLayout } from '../Components'
import { saveAs } from 'file-saver'

const TranscriptButton = ({ id }) => {
    const history = useHistory()
    const role = localStorage.getItem('role')
    const TRANSCRIPT_OPTIONS = {
        CHANGE: 'Change Transcript',
        CLEAR: 'Clear Transcript',
    }

    const handleClick = (val) => {}

    if (role === 'admin' || role === 'uploader') {
        return (
            <>
                <DropDown
                    selected={'Transcript'}
                    list={[TRANSCRIPT_OPTIONS.CHANGE, TRANSCRIPT_OPTIONS.CLEAR]}
                    setSelected={handleClick}
                />
            </>
        )
    } else return null
}

const TranscriptEditor = ({
    transcriptData,
    jumpTo,
    fileName,
    setTranscriptData,
}) => {
    const { id } = useParams()

    const handleWordChange = (slIndex, ssIndex, wIndex, text) => {
        setTranscriptData((prevState) => {
            const currentAudioDoc = { ...prevState.AudioDoc }
            currentAudioDoc.SegmentList[slIndex].SpeechSegment[ssIndex].Word[
                wIndex
            ]._ = text
            return { AudioDoc: currentAudioDoc }
        })
    }

    const handleDownload = () => {
        saveAs(
            `${process.env.REACT_APP_STUDIO_URL}/static/transcripts/${fileName}`,
            fileName
        )
    }

    const handleSave = async () => {
        const r = window.confirm('Are you sure you want to save?')
        if (!r) {
            return false
        }
        var builder = new xml2js.Builder()
        var xml = builder.buildObject(transcriptData)
        try {
            const res = await axios.put(
                `${process.env.REACT_APP_STUDIO_URL}/upload/transcript`,
                { fileName, data: xml }
            )
            toast.success('Transcript updated successfully')
        } catch (ex) {
            toast.error(ex.message)
        }
    }

    return (
        <div>
            <HorizontalLayout className="align-items-center">
                <TranscriptButton id={id} />

                <button
                    onClick={handleDownload}
                    className="btn btn-warning text-light mx-2"
                >
                    Download
                </button>
                <button onClick={handleSave} className="btn btn-success">
                    Save
                </button>
                <div className="ml-auto">
                    <Link className="ml-auto" to={`/transcriptStudio/${id}`}>
                        Go to Magor Video Studio
                    </Link>
                </div>
            </HorizontalLayout>
            <div className="transcript-editor">
                {transcriptData &&
                    transcriptData.AudioDoc.SegmentList.map((sl, slIndex) =>
                        sl.SpeechSegment.map((ss, ssIndex) => (
                            <div
                                className="speechSegment"
                                key={ss.$.stime.toString()}
                            >
                                <label
                                    onClick={() => jumpTo(ss.$.stime * 1000)}
                                >
                                    {moment
                                        .utc(ss.$.stime * 1000)
                                        .format('HH:mm:ss')}{' '}
                                </label>
                                <p>
                                    {ss.Word.map((w, wIndex) => (
                                        <span
                                            onInput={(e) =>
                                                handleWordChange(
                                                    slIndex,
                                                    ssIndex,
                                                    wIndex,
                                                    e.target.innerHTML
                                                )
                                            }
                                            suppressContentEditableWarning={
                                                true
                                            }
                                            contentEditable={true}
                                            key={wIndex}
                                        >
                                            {w._}
                                        </span>
                                    ))}
                                </p>
                            </div>
                        ))
                    )}
            </div>

            <Toaster
                position="bottom-right"
                reverseOrder
                toastOptions={{
                    style: {
                        borderRadius: '10px',
                        background: '#333',
                        color: '#fff',
                    },
                }}
            />
        </div>
    )
}

export default TranscriptEditor
