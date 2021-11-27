import React, { useState, useEffect } from 'react'
import axios from 'axios'
import { useHistory } from 'react-router-dom'
import { Button } from 'react-bootstrap'

import {
    FlexContainerCentered,
    Title,
    Para,
    VerticalLayout,
} from './Components/'

const im = (set) => (e) => set(e.target.value)

const Register = (props) => {
    useEffect((_) => {
        localStorage.clear()
        document.title = "Register - Magor"
    })
    const history = useHistory()
    const [res, setRes] = useState('')
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [password, setPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')

    const register = async (e) => {
        e.preventDefault()

        if (password !== confirmPassword) {
            window.alert('Password and Confirmed Password not same.')
            return
        }

        let payload = {
            name,
            email,
            password,
        }
        try {
            const { data } = await axios.post(
                `${process.env.REACT_APP_APIURL}/register`,
                payload
            )
            if (data) {
                window.alert(
                    `Successfully registered user: ${data.user.email}. Redirecting to login!`
                )
                history.push('/login')
            }
            console.log(data)
        } catch ({ response }) {
            if (response) {
                console.log(response)
            } else {
                window.alert('Unknown error. Please try again!')
            }
        }
    }

    return (
        <>
            <FlexContainerCentered id="Login">
                <VerticalLayout
                    style={{
                        height: 300,
                        alignItems: 'stretch',
                        textAlign: 'center',
                    }}
                >
                    <Title thin style={{ fontSize: 50 }} text="Register" />
                    {res && <Para>{res}</Para>}
                    <form onSubmit={register}>
                        <VerticalLayout
                            style={{
                                height: 300,
                                alignItems: 'stretch',
                                textAlign: 'center',
                            }}
                        >
                            <input
                                type="text"
                                placeholder="Name"
                                value={name}
                                required
                                onChange={im(setName)}
                            />
                            <input
                                type="email"
                                placeholder="Email"
                                value={email}
                                autocomplete="off"
                                required
                                onChange={im(setEmail)}
                            />
                            <input
                                type="password"
                                placeholder="Password"
                                value={password}
                                autoComplete="off"
                                required
                                minLength="6"
                                onChange={im(setPassword)}
                            />
                            <input
                                type="password"
                                placeholder="Confirm Password"
                                value={confirmPassword}
                                required
                                minLength="6"
                                onChange={im(setConfirmPassword)}
                            />
                            <Button type="submit">Submit</Button>
                        </VerticalLayout>
                    </form>
                    <hr />
                    <Button
                        variant="outline-secondary"
                        onClick={() => {
                            history.push('/login')
                        }}
                    >
                        Already registered? Login here.
                    </Button>
                </VerticalLayout>
            </FlexContainerCentered>
        </>
    )
}

export default Register
