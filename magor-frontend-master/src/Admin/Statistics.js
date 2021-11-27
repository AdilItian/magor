import React, { useState, useEffect } from 'react'

import dataProvider from '../dataProvider'

import './statistics.css'

const MinMaxAv = ({ label, min, max, av, processor }) => {
    return (
        <div className="statistics__keyValue" style={{ paddingTop: 17 }}>
            <div className="statistics__field">{label}</div>
            <label
                className="statistics__minMaxAv__dataLabel"
                style={{ marginTop: -17 }}
            >
                MIN <span>{processor(min)}</span>
            </label>
            <div className="statistics__minMaxAv__bar">
                <div
                    className="statistics__minMaxAv__average"
                    style={{
                        left: `${((av - min) / (max - min)) * 100}%`,
                    }}
                >
                    <label
                        className="statistics__minMaxAv__dataLabel"
                        style={{
                            left: '200%',
                            marginTop: -17,
                            position: 'absolute',
                        }}
                    >
                        AVG{' '}
                        <span style={{ color: '#fff' }}>{processor(av)}</span>
                    </label>
                </div>
            </div>
            <label
                className="statistics__minMaxAv__dataLabel"
                style={{ marginTop: -17 }}
            >
                MAX <span>{processor(max)}</span>
            </label>
        </div>
    )
}

const KeyValuePair = ({ label, value }) => (
    <div className="statistics__keyValue">
        <div className="statistics__field">{label}</div>
        <div className="statistics__value">{value}</div>
    </div>
)

const Statistics = (props) => {
    const [data, setData] = useState(null)
    const [error, setError] = useState(null)

    useEffect(() => {
        dataProvider.getCustom('statistics').then(setData).catch(setError)
    }, [])

    return (
        <div>
            <h1>Statistics</h1>
            {data && (
                <div>
                    <h2>Recordings</h2>
                    <KeyValuePair label="Total" value={data.recordings.count} />
                    <MinMaxAv
                        label="Duration (sec)"
                        processor={parseInt}
                        min={data.recordings.minDuration}
                        max={data.recordings.maxDuration}
                        av={data.recordings.averageDuration}
                    />
                    <MinMaxAv
                        label="Tags"
                        processor={(a) => a.toFixed(2)}
                        min={data.recordings.minTags}
                        max={data.recordings.maxTags}
                        av={data.recordings.averageTags}
                    />
                    <MinMaxAv
                        label="Unique Words"
                        processor={parseInt}
                        min={data.recordings.minUniqueWords}
                        max={data.recordings.maxUniqueWords}
                        av={data.recordings.averageUniqueWords}
                    />
                    <MinMaxAv
                        label="Transcripts"
                        processor={(a) => a.toFixed(2)}
                        min={data.recordings.minTranscripts}
                        max={data.recordings.maxTranscripts}
                        av={data.recordings.averageTranscripts}
                    />
                    <KeyValuePair
                        label="Most Popular Tags"
                        value={data.recordings.mostPopularTags.map((t) => (
                            <a
                                className="statistics__tag"
                                href={`/search/tag:${t.name}`}
                                alt={`Search for recordings containing the tag ${t.name}`}
                                key={t.name}
                            >
                                {t.name}({t.count}),{' '}
                            </a>
                        ))}
                    />
                    <h2>ASR Requests</h2>
                    <KeyValuePair
                        label="Total"
                        value={data.asrRequests.count}
                    />
                    <KeyValuePair
                        label="Completed"
                        value={data.asrRequests.completed}
                    />
                    {data.asrRequests.completed < data.asrRequests.count && (
                        <KeyValuePair
                            label="Oldest Incomplete Request"
                            value={`${
                                data.asrRequests.oldestPendingASR._id
                            } (${new Date(
                                data.asrRequests.oldestPendingASR.date
                            ).toLocaleDateString()})`}
                        />
                    )}
                </div>
            )}
            {error && <pre>{JSON.stringify(error, null, 2)}</pre>}
        </div>
    )
}

export default Statistics
