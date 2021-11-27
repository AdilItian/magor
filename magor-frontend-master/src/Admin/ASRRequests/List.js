import React from 'react'
import {
    List,
    Datagrid,
    TextField,
    DateField,
    BooleanField,
    ReferenceField,
} from 'react-admin'

const UserList = (props) => (
    <>
        <p>Click on any field header to sort by that field</p>
        <List {...props} sort={{ field: 'date', order: 'DESC' }}>
            <Datagrid rowClick="edit">
                <TextField source="recordingId" />
                <ReferenceField
                    label="Recording"
                    source="recordingId"
                    reference="recordings"
                >
                    <TextField source="title" />
                </ReferenceField>
                <TextField source="asrId" />
                <BooleanField source="completed" />
                <DateField source="date" />
                <RecordingLinkField />
            </Datagrid>
        </List>
    </>
)

const RecordingLinkField = ({ record = {} }) => {
    return (
        <a
            href={`/recording/${record.recordingId}`}
            target="_blank"
            rel="noopener noreferrer"
        >
            View on Magor
        </a>
    )
}

export default UserList
