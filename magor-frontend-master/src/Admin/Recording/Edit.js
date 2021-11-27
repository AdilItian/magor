import React from 'react'
import {
    Edit,
    SimpleForm,
    TextInput,
    ArrayInput,
    SimpleFormIterator,
    ReferenceInput,
    DateInput,
    SelectInput,
} from 'react-admin'

const RecordingEdit = (props) => (
    <Edit title="Edit User" {...props}>
        <SimpleForm>
            <TextInput fullWidth source="title" label="Title" />
            <TextInput
                multiline
                fullWidth
                source="description"
                label="Description"
            />
            <TextInput fullWidth source="path" label="Recording Path" />
            <ArrayInput source="transcripts" label="Transcripts">
                <SimpleFormIterator>
                    <TextInput
                        fullWidth
                        source="path"
                        label="Transcript Path"
                    />
                    <TextInput
                        fullWidth
                        source="name"
                        label="Transcript name"
                    />
                    <div style={{ display: 'flex' }}>
                        <ReferenceInput
                            source="uploaderId"
                            reference="users"
                            label="Uploader"
                        >
                            <SelectInput
                                optionText="name"
                                disabled={true}
                                label="Name"
                            />
                        </ReferenceInput>
                        <DateInput
                            source="uploadDate"
                            disabled={true}
                            label="Upload Date"
                        />
                    </div>
                </SimpleFormIterator>
            </ArrayInput>
            <ArrayInput source="imageCaptions" label="Image Captions">
                <SimpleFormIterator>
                    <TextInput
                        fullWidth
                        source="path"
                        label="Transcript Path"
                    />
                    <TextInput
                        fullWidth
                        source="name"
                        label="Transcript name"
                    />
                    <div style={{ display: 'flex' }}>
                        <ReferenceInput
                            source="uploaderId"
                            reference="users"
                            label="Uploader"
                        >
                            <SelectInput
                                optionText="name"
                                disabled={true}
                                label="Name"
                            />
                        </ReferenceInput>
                        <DateInput
                            source="uploadDate"
                            disabled={true}
                            label="Upload Date"
                        />
                    </div>
                </SimpleFormIterator>
            </ArrayInput>
            <ArrayInput disabled source="soundCaptions" label="Sound Captions">
                <SimpleFormIterator>
                    <TextInput
                        fullWidth
                        source="path"
                        label="Transcript Path"
                    />
                    <TextInput
                        fullWidth
                        source="name"
                        label="Transcript name"
                    />
                    <div style={{ display: 'flex' }}>
                        <ReferenceInput
                            source="uploaderId"
                            reference="users"
                            label="Uploader"
                        >
                            <SelectInput
                                optionText="name"
                                disabled={true}
                                label="Name"
                            />
                        </ReferenceInput>
                        <DateInput
                            source="uploadDate"
                            disabled={true}
                            label="Upload Date"
                        />
                    </div>
                </SimpleFormIterator>
            </ArrayInput>
            <ReferenceInput source="uploaderId" reference="users">
                <SelectInput optionText="name" disabled={true} />
            </ReferenceInput>
            <DateInput
                source="uploadDate"
                label="Upload Date"
                disabled={true}
            />
        </SimpleForm>
    </Edit>
)

export default RecordingEdit
