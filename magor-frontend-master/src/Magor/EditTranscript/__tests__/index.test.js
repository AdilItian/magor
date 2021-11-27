/* eslint-disable import/first */
jest.mock('react-router-dom', () => ({
    ...jest.requireActual('react-router-dom'),
    useParams: () => {
        return {
            id: global.localStorage.getItem('Recording.params.id'),
            query: global.localStorage.getItem('Recording.params.query'),
        }
    },
}))
jest.mock('../../../dataProvider.js')
import React from 'react'
import { create, act } from 'react-test-renderer'
import Recording, { ALL_REC } from '../index'
import { createMemoryHistory } from 'history'
import { Router } from 'react-router-dom'
import { DropDown, SearchBar, SearchButton, Tag } from '../../Components/'
import Transcript from '../Transcript'

const OLD_ENV = process.env

beforeEach(() => {
    jest.resetModules()
    process.env = { ...OLD_ENV, REACT_APP_APIURL: '$APIURL' }
})

afterEach(() => {
    process.env = OLD_ENV
})

test('No-undef', () => {
    expect(Recording).toBeDefined()
})

test('Null checks', async () => {
    let rec
    await act(async () => {
        rec = create(<Recording />)
    })
    expect(rec.toJSON()).toBeNull()
    localStorage.setItem('Recording.params.query', 'Some query')
    await act(async () => {
        rec = create(<Recording />)
    })
    expect(rec.toJSON()).toBeNull()
})

let rec
const history = createMemoryHistory()

test('Make sure a recording renders', async () => {
    localStorage.setItem('Recording.params.id', 'r0')
    localStorage.removeItem('Recording.params.query')
    await act(async () => {
        rec = create(
            <Router history={history}>
                <Recording />
            </Router>
        )
    })
    await act(async () => {
        // add additional delay to to allow the component to render completely
        await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(rec).toMatchSnapshot()
})

test('RecordingSearch tests', async () => {
    localStorage.setItem('Recording.params.query', 'chinese')
    history.push = jest.fn(() => {})
    await act(async () => {
        rec = create(
            <Router history={history}>
                <Recording />
            </Router>
        )
    })
    await act(async () => {
        // add additional delay to to allow the component to render completely
        await new Promise((resolve) => setTimeout(resolve, 50))
    })
    expect(rec).toMatchSnapshot()
    const recordingSearch = rec.root.findByProps({ query: 'chinese' })
    const searchBar = recordingSearch.findByType(SearchBar)
    const searchButton = recordingSearch.findByType(SearchButton)
    const dropDown = recordingSearch.findAllByType(DropDown)[0]
    const tag = rec.root.findAllByType(Tag)[0]
    const tx = rec.root.findByType(Transcript)

    expect(recordingSearch).not.toBeNull() // Make sure our query renders
    await act(async () => {
        searchBar.props.handleChange('recording')
    })
    expect(searchBar.props.value).toBe('recording')
    await act(async () => {
        searchBar.props.performSearch()
    })
    expect(tx.props.query).toBe('recording')

    await act(async () => {
        tag.props.onClick()
    })
    expect(tx.props.query).toBe('tagName')

    await act(async () => {
        searchBar.props.handleChange('recording chinese')
        dropDown.props.setSelected(ALL_REC)
    })
    await act(async () => {
        searchButton.props.performSearch()
    })
    expect(history.push).toHaveBeenCalledTimes(1)
    expect(
        history.push.mock.calls[0][0].match('recording chinese')
    ).toBeTruthy()
})

test('Make sure edit button works', async () => {
    localStorage.setItem('role', 'admin')
    history.push = jest.fn(() => {})
    await act(async () => {
        rec = create(
            <Router history={history}>
                <Recording />
            </Router>
        )
    })
    await act(async () => {
        rec.root.findByProps({ id: 'EditButton' }).props.onClick()
    })
    expect(history.push).toHaveBeenCalledTimes(1)
    expect(history.push.mock.calls[0][0].match('edit/r0')).toBeTruthy()
})
