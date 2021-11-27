import React from "react";
import {
  List,
  Datagrid,
  TextField,
  EmailField,
  DeleteButton,
  EditButton,
} from "react-admin";

const UserList = (props) => (
  <List {...props}>
    <Datagrid rowClick="edit">
      <EmailField source="email" />
      <TextField source="name" />
      <TextField source="role" />
      <TextField source="userStatus" />
      <EditButton />
      <DeleteButton />
    </Datagrid>
  </List>
);

export default UserList;
