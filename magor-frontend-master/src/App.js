import React from 'react'
import {
    BrowserRouter as Router,
    Switch,
    Route,
    Redirect,
} from 'react-router-dom'

import authProvider from './authProvider'

import Admin from './Admin/'
import Magor from './Magor/'
import SearchResults from './Magor/SearchResults'
import Recording from './Magor/Recording/'
import Login from './Magor/Login'
import Upload from './Magor/Upload/'
import UploadBatch from './Magor/Upload/UploadBatch'
import RecordingsManager from './Magor/RecordingsManager/'
import Edit from './Magor/RecordingsManager/Edit'
import CaptionMaker from './Magor/CaptionMaker'
import Studio from './Magor/Studio'
import TranscriptStudio from './Magor/TranscriptStudio'
import EditTranscript from './Magor/EditTranscript'

import 'bootstrap/dist/css/bootstrap.min.css'
import Register from './Magor/Register'

const App = () => (
    <>
        <Router>
            <Switch>
                <PrivateRoute exact path="/">
                    <Magor />
                </PrivateRoute>
                <PrivateRoute exact path="/search">
                    <Magor />
                </PrivateRoute>
                <PrivateRoute path="/search/:query">
                    <SearchResults />
                </PrivateRoute>
                <PrivateRoute exact path="/recording/:id">
                    <Recording />
                </PrivateRoute>
                <PrivateRoute
                    exact
                    path="/recording/:id/transcript/:transcriptId"
                >
                    <Recording />
                </PrivateRoute>
                <PrivateRoute
                    exact
                    path="/recording/:id/transcript/:transcriptId/:query"
                >
                    <Recording />
                </PrivateRoute>
                <PrivateRoute path="/recording/:id/:query">
                    <Recording />
                </PrivateRoute>
                <PrivateRoute exact path="/studio/:id">
                    <Studio />
                </PrivateRoute>

                <PrivateRoute path="/editTranscript/:id/:query">
                    <EditTranscript />
                </PrivateRoute>
                <PrivateRoute exact path="/editTranscript/:id">
                    <EditTranscript />
                </PrivateRoute>

                <PrivateRoute exact path="/transcriptStudio/:id">
                    <TranscriptStudio />
                </PrivateRoute>
                {/* <PrivateRoute authType={1} path="/upload">
                    <Upload />
                </PrivateRoute> */}
                <PrivateRoute authType={1} path="/batchUpload">
                    <UploadBatch />
                </PrivateRoute>
                <PrivateRoute authType={1} path="/recordingsManager" exact>
                    <RecordingsManager />
                </PrivateRoute>
                {/* <PrivateRoute
                    authType={1}
                    path="/recordingsManager/edit/:recordingId"
                >
                    <Edit />
                </PrivateRoute> */}
                <Route path="/login">
                    <Login />
                </Route>
                <Route path="/register">
                    <Register />
                </Route>
                <Route path="/admin/">
                    <Admin />
                </Route>
                <Route path="/captionMaker">
                    <CaptionMaker />
                </Route>
            </Switch>
        </Router>
    </>
)

const PrivateRoute = ({ authType, children, ...rest }) => {
    return (
        <Route
            {...rest}
            render={({ location }) => {
                const { allowed, ...others } =
                    authProvider.checkAuthType(authType)
                return allowed ? (
                    children
                ) : (
                    <Redirect
                        to={{
                            pathname: '/login',
                            state: {
                                from: location,
                                ...others,
                            },
                        }}
                    />
                )
            }}
        />
    )
}

export default App
