import React from "react";
import {
  Create,
  SimpleForm,
  TextInput,
  ArrayInput,
  SimpleFormIterator,
  NumberInput,
} from "react-admin";

const RecordingCreate = (props) => (
  <Create title="Create User" {...props}>
    <SimpleForm>
      <TextInput source="title" label="Title" />
      <TextInput source="description" label="Description" />
      <TextInput source="path" label="Recording Path" />
      <ArrayInput source="tags" label="Tags">
        <SimpleFormIterator>
          <TextInput source="tagId" label="Tag ID" />
          <TextInput source="tagName" label="Tag Name" />
          <TextInput source="source" label="Tag Source" />
        </SimpleFormIterator>
      </ArrayInput>
      <ArrayInput source="transcripts" label="Transcripts">
        <SimpleFormIterator>
          <TextInput source="path" label="Transcript Path" />
          <TextInput source="format" label="Transcript Format" />
          <NumberInput source="version" label="Transcript Version" />
        </SimpleFormIterator>
      </ArrayInput>
    </SimpleForm>
  </Create>
);

export default RecordingCreate;
