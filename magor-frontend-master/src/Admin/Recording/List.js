import React, { useState } from 'react'
import {
    EditButton,
    DeleteButton,
    List,
    Datagrid,
    TextField,
    ReferenceField,
    DateField,
} from 'react-admin'
import { TextField as TextInput, Button as Submit } from '@material-ui/core'

const RecordingList = (props) => {
    const [filter, setFilter] = useState('')
    return (
        <>
            <p style={{ margin: 0 }}>
                Click on any field header to sort by that field
            </p>
            <Filter setFilter={setFilter} />
            <List
                {...props}
                sort={{ field: 'uploadDate', order: 'DESC' }}
                filter={{
                    key: filter,
                    fields: ['title', 'description', 'tags.tagName'],
                }}
            >
                <Datagrid rowClick="edit">
                    <TextField source="title" />
                    <TextField source="description" />
                    <TextField source="path" />
                    <ReferenceField source="uploaderId" reference="users">
                        <TextField source="name" />
                    </ReferenceField>
                    <DateField source="uploadDate" />
                    <EditButton />
                    <DeleteButton />
                    <RecordingLinkField />
                </Datagrid>
            </List>
        </>
    )
}

const Filter = (props) => {
    const [value, setValue] = useState('')
    return (
        <p style={{ margin: 0 }}>
            Filter by title, description, tags:{' '}
            <TextInput
                value={value}
                onChange={(e) => setValue(e.target.value)}
            />
            <Submit onClick={() => props.setFilter(value)} color="primary">
                Apply
            </Submit>
        </p>
    )
}

const RecordingLinkField = ({ record = {} }) => {
    return (
        <a
            href={`/recording/${record._id}`}
            target="_blank"
            rel="noopener noreferrer"
        >
            View
        </a>
    )
}

export default RecordingList
