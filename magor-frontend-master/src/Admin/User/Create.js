import React from "react";
import {
  Create,
  SimpleForm,
  TextInput,
  PasswordInput,
  AutocompleteInput,
} from "react-admin";

const UserCreate = (props) => (
  <Create title={`Create User`} {...props}>
    <SimpleForm>
      <TextInput source="name" />
      <TextInput source="email" />
      <PasswordInput source="password" />
      <AutocompleteInput
        source="role"
        choices={[
          { id: "admin", name: "Admin" },
          { id: "user", name: "User" },
          { id: "uploader", name: "Uploader" },
        ]}
      />
    </SimpleForm>
  </Create>
);

export default UserCreate;
