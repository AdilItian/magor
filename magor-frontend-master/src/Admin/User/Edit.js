import React from "react";
import { Edit, SimpleForm, TextInput, AutocompleteInput } from "react-admin";

const UserEdit = (props) => (
  <Edit title="Edit User" {...props}>
    <SimpleForm>
      <TextInput source="name" />
      <TextInput source="email" />
      <AutocompleteInput
        source="role"
        choices={[
          { id: "admin", name: "Admin" },
          { id: "user", name: "User" },
          { id: "uploader", name: "Uploader" },
        ]}
      />
      <AutocompleteInput
        source="userStatus"
        choices={[
          { id: "unverified", name: "Unverified" },
          { id: "verified", name: "Verified" },
          { id: "disabled", name: "Disabled" },
        ]}
      />
    </SimpleForm>
  </Edit>
);

export default UserEdit;
