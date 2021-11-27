import React, { useState, useEffect } from 'react'
import { useHistory, useLocation } from 'react-router-dom'

import { FlexContainerCentered, VerticalLayout } from './Components/'
import { Button } from 'react-bootstrap'
import { Title, Para } from './Components/'
import authProvider from '../authProvider'
import './login.css'

const roles = ['user', 'uploader', 'admin']

const im = (set) => (e) => set(e.target.value)

const Login = (props) => {
    useEffect((_) => {
        localStorage.clear()
        document.title = 'Login - Magor'
    })
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [res, setRes] = useState('')
    const history = useHistory()
    const location = useLocation()
    const { from, requiredAuthType, hasAuthType } = location.state || {
        from: '/',
    }
    const login = (_) => {
        authProvider
            .login({ username: email, password })
            .then((_) => history.replace(from))
            .catch((err) => {
                setRes('Incorrect Email or Password. Please try again')
                console.error(err)
            })
    }
    return (
        <FlexContainerCentered id="Login">
            <VerticalLayout
                style={{
                    height: 300,
                    alignItems: 'stretch',
                    textAlign: 'center',
                }}
            >
                <Title thin style={{ fontSize: 50 }} text="Login" />
                <label>
                    This section requires {roles[requiredAuthType]} priviledges
                </label>
                {hasAuthType != null ? (
                    <label>You are logged in as {roles[hasAuthType]}</label>
                ) : (
                    <label>Please log in</label>
                )}
                {res && <Para>{res}</Para>}
                <input
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={im(setEmail)}
                />
                <input
                    type="password"
                    placeholder="Password"
                    value={password}
                    onChange={im(setPassword)}
                />
                <Button class="mt-4" onClick={login}>
                    Continue
                </Button>
                <hr />
                <Button
                    variant="outline-secondary"
                    onClick={() => {
                        history.push('/register')
                    }}
                >
                    New to Magor? Register here.
                </Button>
            </VerticalLayout>
        </FlexContainerCentered>
    )
}

export default Login
