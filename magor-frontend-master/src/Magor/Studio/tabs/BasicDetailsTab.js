import React from 'react'
import * as _ from 'lodash'

import { ListGroup } from 'react-bootstrap'

export default (props) => {
    const { mediaData: originalMediaData } = props

    return (
        <div className="py-4">
            <ListGroup>
                {Object.keys(originalMediaData).map((key) => {
                    if (
                        !_.isUndefined(originalMediaData[key]) &&
                        !_.isEmpty(originalMediaData[key])
                    ) {
                        return (
                            <ListGroup.Item key={key}>
                                {key}: {JSON.stringify(originalMediaData[key])}
                            </ListGroup.Item>
                        )
                    } else {
                        return ''
                    }
                })}
            </ListGroup>
        </div>
    )
}
