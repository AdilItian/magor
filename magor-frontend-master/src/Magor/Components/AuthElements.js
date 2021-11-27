import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'

import { DropDown } from './Inputs'

import dataProvider from '../../dataProvider'
import authProvider from '../../authProvider'

import { UploadModal } from './UploadModal'

export const paths = {
    Home: '/',
    'Upload Panel': '/upload',
    'My Uploads': '/recordingsManager',
    'Admin Panel': '/admin/',
    'Log Out': '/login',
}

export const UserDropdown = (props) => {
    const { currentPath } = props

    const [user, setUser] = useState(null)
    const [show, setShow] = useState(false)
    const handleClose = () => setShow(false)
    const handleShow = () => setShow(true)

    const history = useHistory()

    useEffect(() => {
        dataProvider
            .getCustom('')
            .then((res) => {
                res.name && setUser(res)
            })
            .catch((_) => history.push('/login'))
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const logout = (_) => {
        authProvider.logout().then((_) => history.push('/login'))
    }

    if (!user || user.error) return null

    const { name, role } = user
    const admin = role === 'admin'
    const uploader = admin || role === 'uploader'
    const list = []
    list.push('Home')
    if (admin) list.push('Upload Media')
    // if (uploader && currentPath !== 'upload') list.push('Upload Panel')
    if (uploader && currentPath !== 'recordingsManager') list.push('My Uploads')
    if (admin) list.push('Admin Panel')
    list.push('Log Out')

    const performAction = (a) => {
        switch (a) {
            case 'Log Out':
                logout()
                break
            case 'Upload Media':
                handleShow()
                break
            default:
                history.push(paths[a])
        }
    }

    return (
        <>
            <DropDown list={list} selected={name} setSelected={performAction} />
            <UploadModal
                show={show}
                handleShow={handleShow}
                handleClose={handleClose}
            />
        </>
    )
}
