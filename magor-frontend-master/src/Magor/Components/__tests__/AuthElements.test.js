/* eslint-disable import/first */
jest.mock('../../../dataProvider')
import React from 'react'
import {MemoryRouter, Router} from 'react-router-dom'
import {createMemoryHistory} from 'history'
import {UserDropdown, paths} from '../AuthElements'
import renderer from 'react-test-renderer'

beforeEach(() => {
    localStorage.clear();
})

test('No undefined', () => {
    expect(UserDropdown).toBeDefined()
    expect(paths).toBeDefined()
})

test('Basic tests', async () => {
    let menu;
    await renderer.act(async () => {
        menu = renderer.create(
            <MemoryRouter>
                <UserDropdown />
            </MemoryRouter>
        )
    })
    expect(menu.toJSON()).toMatchSnapshot()
})

test('Test different auth types', async () => {
    let menu;
    localStorage.setItem('role', 'admin')
    await renderer.act(async () => {
        menu = renderer.create(
            <MemoryRouter>
                <UserDropdown />
            </MemoryRouter>
        )
    })
    expect(menu.root.findAllByType('li').map((li) => li.children[0])).toEqual([
        'Home',
        'Upload Panel',
        'My Uploads',
        'Admin Panel',
        'Log Out',
    ])

    localStorage.setItem('role', 'uploader')
    await renderer.act(async () => {
        menu = renderer.create(
            <MemoryRouter>
                <UserDropdown />
            </MemoryRouter>
        )
    })
    expect(menu.root.findAllByType('li').map((li) => li.children[0])).toEqual([
        'Home',
        'Upload Panel',
        'My Uploads',
        // 'Admin Panel',
        'Log Out',
    ])

    localStorage.setItem('role', 'user')
    await renderer.act(async () => {
        menu = renderer.create(
            <MemoryRouter>
                <UserDropdown />
            </MemoryRouter>
        )
    })
    expect(menu.root.findAllByType('li').map((li) => li.children[0])).toEqual([
        'Home',
        // 'Upload Panel',
        // 'My Uploads',
        // 'Admin Panel',
        'Log Out',
    ])
})

test('Test different paths', async () => {
    let menu;
    await renderer.act(async () => {
        menu = renderer.create(
            <MemoryRouter>
                <UserDropdown currentPath="upload" />
            </MemoryRouter>
        )
    })
    expect(menu.root.findAllByType('li').map(li => li.children[0])).not.toContain('Upload Panel')

    await renderer.act(async () => {
        menu.update(
            <MemoryRouter>
                <UserDropdown currentPath="recordingsManager" />
            </MemoryRouter>
        )
    })
    expect(menu.root.findAllByType('li').map(li => li.children[0])).not.toContain('My Uploads')
})

test('Test logged-out version', async () => {
    localStorage.setItem('loggedOut', true)
    const history = createMemoryHistory()
    await renderer.act(async () => {
        renderer.create(
            <Router history={history}>
                <UserDropdown />
            </Router>
        )
    })
    expect(history.location.pathname).toBe('/login')
})

test('Test navigation functionality', async () => {
    let menu
    const history = createMemoryHistory()
    history.push = jest.fn(() => {})
    await renderer.act(async () => {
        menu = renderer.create(
            <Router history={history}>
                <UserDropdown />
            </Router>
        )
    })
    const lis = menu.root.findAllByType('li')
    await renderer.act(async () => {
        for(let li of lis) {
            li.props.onClick()
        }
    })
    expect(history.push).toHaveBeenCalledTimes(lis.length)
    expect(history.push.mock.calls.map((call) => call[0])).toEqual(
        lis.map((li) => paths[li.children[0]])
    )
})