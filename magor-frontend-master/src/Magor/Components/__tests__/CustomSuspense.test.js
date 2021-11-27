/* eslint-disable import/first */
jest.mock('../../../dataProvider')
import Suspense from '../CustomSuspense'
import React from 'react'
import renderer from 'react-test-renderer'
import { Router } from 'react-router-dom'
import { createMemoryHistory } from 'history'

let container

beforeEach(() => {
    container = document.createElement('div')
    document.body.appendChild(container)
})

afterEach(() => {
    document.body.removeChild(container)
    container = null
})

test('No undefined', () => {
    expect(Suspense).toBeDefined()
})

test('Snapshot test', () => {
    const suspense = renderer.create(<Suspense />)
    expect(suspense.toJSON()).toBeNull()

    const suspenseWithMethod = renderer.create(<Suspense method="getOne" />)
    expect(suspenseWithMethod.toJSON()).toBeNull()

    const suspenseWithParams = renderer.create(<Suspense params={[]} />)
    expect(suspenseWithParams.toJSON()).toBeNull()
})

test('Suspense correctly renders Loading and Success displays', async () => {
    const LoadingDisplay = jest.fn(() => <p>Loading...</p>)
    const ErrorDisplay = jest.fn(() => <p>Error Occured</p>)
    const SuccessDisplay = jest.fn((props) => <p>{props.data._id}</p>)
    await renderer.act(async () => {
        renderer.create(
            <Suspense
                method="getOne"
                params={['users', { id: 'u0' }]}
                SuccessDisplay={SuccessDisplay}
                LoadingDisplay={LoadingDisplay}
                ErrorDisplay={ErrorDisplay}
            />
        )
    })
    expect(ErrorDisplay).not.toHaveBeenCalled()
    expect(LoadingDisplay).toHaveBeenCalled()
    expect(SuccessDisplay).toHaveBeenCalledTimes(1)
    expect(SuccessDisplay.mock.calls[0][0].data.data._id).toBe('u0')
})

test('Suspense correctly renders Error display', async () => {
    const LoadingDisplay = jest.fn(() => <p>Loading...</p>)
    const ErrorDisplay = jest.fn(() => <p>Error Occured</p>)
    const SuccessDisplay = jest.fn((props) => <p>{props.data._id}</p>)
    const history = createMemoryHistory()
    history.push = jest.fn(() => {})
    await renderer.act(async () => {
        renderer.create(
            <Router history={history}>
                <Suspense
                    method="getOne"
                    params={['users', { id: 'u5' }]}
                    SuccessDisplay={SuccessDisplay}
                    LoadingDisplay={LoadingDisplay}
                    ErrorDisplay={ErrorDisplay}
                />
            </Router>
        )
    })
    expect(LoadingDisplay).toHaveBeenCalled()
    expect(ErrorDisplay).toHaveBeenCalledTimes(1)
    expect(SuccessDisplay).not.toHaveBeenCalled()
    expect(ErrorDisplay.mock.calls[0][0].error.status).toBe(404)
})

test('Default error works', async () => {
    let suspense
    const history = createMemoryHistory()
    history.push = jest.fn(() => {})
    await renderer.act(async () => {
        suspense = renderer.create(
            <Router history={history}>
                <Suspense
                    method="getOne"
                    params={['users', { id: 'u5' }]}
                    doNotLogErrors={true}
                />
            </Router>
        )
    })
    expect(suspense.toJSON()).toMatchSnapshot()
    await new Promise((resolve) => setTimeout(resolve, 500))
    expect(history.push).toHaveBeenCalledTimes(1)
    expect(history.push.mock.calls[0][0]).toBe('/')
})

test('Default success display works', async () => {
    let suspense
    await renderer.act(async () => {
        suspense = renderer.create(
            <Suspense method="getOne" params={['users', { id: 'u0' }]} />
        )
    })
    await new Promise((resolve) => setTimeout(resolve, 1000))
    expect(suspense.root.findByType('pre')).not.toBeNull()
    expect(suspense.root.findByType('pre').children[0].match('u0')).toBeTruthy()
})

test('make sure change in _key causes rerender', async () => {
    let suspense
    const history = createMemoryHistory()
    history.push = jest.fn(() => {})
    await renderer.act(async () => {
        suspense = renderer.create(
            <Router history={history}>
                <Suspense
                    method="getOne"
                    params={['users', { id: 'u5' }]}
                    _key="1"
                />
            </Router>
        )
    })
    expect(suspense.toJSON()).toMatchSnapshot()
    await renderer.act(async () => {
        suspense.update(
            <Suspense
                method="getOne"
                params={['users', { id: 'u0' }]}
                _key="2"
                doNotLogErrors={true}
            />
        )
    })
    expect(suspense.root.findByType('pre')).not.toBeNull()
    expect(suspense.root.findByType('pre').children[0].match('u0')).toBeTruthy()
})

test('Test 401 Unauthorised display', async () => {
    const history = createMemoryHistory()
    history.push = jest.fn(() => {})
    let suspense
    localStorage.setItem('loggedOut', 'true')
    await renderer.act(async () => {
        suspense = renderer.create(
            <Router history={history}>
                <Suspense method="getOne" params={['users', { id: 'u0' }]} />
            </Router>
        )
    })
    await new Promise((resolve) => setTimeout(resolve, 500))
    expect(history.push).toHaveBeenCalledTimes(1)
    expect(suspense.root.findByType('p').children[0].match('401')).toBeTruthy()
    localStorage.clear()
})

test('Test 422 Unprocessable Entry Display', async () => {
    let suspense
    await renderer.act(async () => {
        suspense = renderer.create(
            <Suspense
                method="getOne"
                params={['users']}
                doNotLogErrors={true}
            />
        )
    })
    expect(
        suspense.root.findByType('pre').children[0].match('422')
    ).toBeTruthy()
})

test('Test 422 Unprocessable Entry Display With logging', async () => {
    let suspense
    await renderer.act(async () => {
        suspense = renderer.create(
            <Suspense method="getOne" params={['users']} />
        )
    })
    expect(
        suspense.root.findByType('pre').children[0].match('422')
    ).toBeTruthy()
})
