import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'

import dataProvider from '../../dataProvider'

const DELAY_REDIR = process.env.JEST_WORKER_ID !== undefined ? 0 : 2000

const DefaultLoadingDisplay = () => <p>Loading...</p>

const DefaultErrorDisplay = ({ error, doNotLogErrors }) => {
    const history = useHistory()
    if (!doNotLogErrors) console.error(error)
    switch (error.status) {
        case 404:
            setTimeout(() => history.push('/'), DELAY_REDIR)
            return (
                <p>
                    Error 404: This URL doesn't exist. Redirecting you to
                    home...
                </p>
            )
        case 401:
            setTimeout(() => history.push('/login'), DELAY_REDIR)
            return (
                <p>
                    Error 401: You are unauthorised to see this content. Taking
                    you to the log in page...
                </p>
            )
        default:
            return (
                <>
                    {!doNotLogErrors && (
                        <strong>
                            Error Occured! See console for more details
                        </strong>
                    )}
                    <pre>{JSON.stringify(error, null, 2)}</pre>
                </>
            )
    }
}

const DefaultSuccessDisplay = (s) => <pre>{JSON.stringify(s, null, 2)}</pre>

const CustomSuspense = (props) => {
    const LoadingDisplay = props.LoadingDisplay || DefaultLoadingDisplay
    const ErrorDisplay = props.ErrorDisplay || DefaultErrorDisplay
    const SuccessDisplay = props.SuccessDisplay || DefaultSuccessDisplay
    const successProps = props.successProps || {}
    const { method, params, _key } = props

    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState(null)
    const [data, setData] = useState(null)

    useEffect(() => {
        try {
            setIsLoading(true)
            setError(false)
            setData(null)
            dataProvider[method](...params)
                .then((d) => {
                    setData(d)
                    setIsLoading(false)
                })
                .catch((e) => {
                    setError(e)
                    setIsLoading(false)
                })
        } catch (err) {
            setIsLoading(false)
            setError(err)
        }
        return (_) => {
            setData(null)
            setIsLoading(false)
            setError(false)
        }
        // eslint-disable-next-line
    }, [_key])

    if (typeof method !== 'string' || !Array.isArray(params)) return null
    if (isLoading) return <LoadingDisplay />
    if (error)
        return (
            <ErrorDisplay error={error} doNotLogErrors={props.doNotLogErrors} />
        )
    if (data) return <SuccessDisplay {...successProps} data={data} />
    return null
}

export default CustomSuspense
