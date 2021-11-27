import React, { useState } from 'react'
import { Button, Spinner } from 'react-bootstrap'

import _ from 'lodash'

export const AsyncSpinner = (props) => {
    const {
        onClick,
        value = 'null',
        postSuccess,
        postError,
        shouldConfirm = false,
        ...otherProps
    } = props
    const [isLoading, setLoading] = useState(false)

    const execute = () => {
        let confirm = true

        if (shouldConfirm) {
            confirm = window.confirm('Are you sure you want to proceed?')
            if (confirm === false) return
        }

        const resetSpinner = () => {
            setTimeout(() => setLoading(false), 200)
        }

        setLoading(true)
        onClick()
            .then(() => {
                if (postSuccess && _.isFunction(postSuccess)) {
                    postSuccess()
                } else {
                    resetSpinner()
                }
            })
            .catch((err) => {
                console.log(err)
                if (postError && _.isFunction(postError)) {
                    postError()
                } else {
                    resetSpinner()
                }
            })
    }
    if (!_.isFunction(onClick)) {
        console.error(`send an async function as f param in AsyncSpinner.`)
        return ``
    }
    return (
        <Button {...otherProps} onClick={execute}>
            {isLoading && (
                <Spinner animation="border" size="sm" className="mr-1" />
            )}
            {value}
        </Button>
    )
}
