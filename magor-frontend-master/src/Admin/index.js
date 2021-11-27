import React, { useEffect } from 'react'
import { Admin, Resource } from 'react-admin'
import { Route } from 'react-router-dom'

import AdminLayout from './AdminLayout'
import Menu from './Menu'
import { UserList, UserEdit, UserCreate } from './User'
import { RecordingList, RecordingEdit, RecordingCreate } from './Recording'
import ASRRequestsList from './ASRRequests/List'

import Statistics from './Statistics'

import authProvider from '../authProvider'
import dataProvider from '../dataProvider'

const App = () => {
    useEffect(() => {
        document.title = 'Admin Panel - Magor'
    }, [])
    return (
        <Admin
            layout={AdminLayout}
            menu={Menu}
            authProvider={authProvider}
            dataProvider={dataProvider}
            customRoutes={[
                <Route exact path="/statistics" component={Statistics} />,
            ]}
        >
            <Resource
                name="users"
                options={{ label: 'Users' }}
                list={UserList}
                edit={UserEdit}
                create={UserCreate}
            />
            <Resource
                name="recordings"
                options={{ Label: 'Recordings' }}
                list={RecordingList}
                edit={RecordingEdit}
                create={RecordingCreate}
            />
            <Resource
                name="asrRequests"
                options={{ Label: 'ASR Requests' }}
                list={ASRRequestsList}
            />
        </Admin>
    )
}

export default App
