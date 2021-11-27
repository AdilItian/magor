import React from 'react'
import { SearchBar, SearchButton, NamedSearchBar } from '../Search'
import renderer, { act } from 'react-test-renderer'

test('No undefined', () => {
    expect(SearchBar).toBeDefined()
    expect(SearchButton).toBeDefined()
    expect(NamedSearchBar).toBeDefined()
})

test('SearchButton basic tests', () => {
    const searchButton = renderer.create(<SearchButton />)
    expect(searchButton.toJSON()).toBeNull()

    const searchButtonWithEmptyFunc = renderer.create(
        <SearchButton performSearch={1} />
    )
    expect(searchButtonWithEmptyFunc.toJSON()).toBeNull()

    const searchButtonWithFunc = renderer.create(
        <SearchButton performSearch={() => {}} />
    )
    expect(searchButtonWithFunc.toJSON()).toMatchSnapshot()
    expect(searchButtonWithFunc.toJSON().props.className.trim()).toBe(
        'searchButton'
    )

    const searchButtonSmall = renderer.create(
        <SearchButton small performSearch={() => {}} />
    )
    expect(searchButtonSmall.toJSON()).toMatchSnapshot()
    expect(searchButtonSmall.toJSON().props.className.trim()).toBe(
        'searchButton small'
    )
})

test('SearchButton calls callback on click', () => {
    const performSearch = jest.fn(() => {})
    const searchButton = renderer.create(
        <SearchButton performSearch={performSearch} />
    )
    let tree = searchButton.toJSON()
    expect(tree).toMatchSnapshot()
    tree.props.onClick()
    expect(performSearch).toHaveBeenCalledTimes(1)
})

test('Basic SearchBar tests', () => {
    const searchBarWithoutCallbacks = renderer.create(<SearchBar />)
    expect(searchBarWithoutCallbacks.toJSON()).toBeNull()

    const searchBarWithoutHandleChange = renderer.create(
        <SearchBar performSearch={() => {}} />
    )
    expect(searchBarWithoutHandleChange.toJSON()).toBeNull()

    const searchBarWithoutPerformSearch = renderer.create(
        <SearchBar handleChange={() => {}} />
    )
    expect(searchBarWithoutPerformSearch.toJSON()).toBeNull()

    const validSearchBar = renderer.create(
        <SearchBar handleChange={() => {}} performSearch={() => {}} />
    )
    expect(validSearchBar.toJSON()).toMatchSnapshot()

    const searchBarSmall = renderer.create(
        <SearchBar small handleChange={() => {}} performSearch={() => {}} />
    )
    expect(searchBarSmall.toJSON()).toMatchSnapshot()
    expect(searchBarSmall.root.findByType('input').props.className.trim()).toBe(
        'font searchBar small'
    )

    const searchBarWithMatches = renderer.create(
        <SearchBar
            matches={['match1', 'match2']}
            handleChange={() => {}}
            performSearch={() => {}}
        />
    )
    expect(searchBarWithMatches.root.findAllByType('li')).toHaveLength(2)
    expect(
        searchBarWithMatches.root
            .findAllByType('li')
            .map((li) => li.children[0])
    ).toEqual(['match1', 'match2'])
    expect(searchBarWithMatches.toJSON()).toMatchSnapshot()
})

test('Searchbar functionality tests', () => {
    const handleChange = jest.fn(() => {})
    const performSearch = jest.fn(() => {})
    const searchbar = renderer.create(
        <SearchBar handleChange={handleChange} performSearch={performSearch} />
    )
    searchbar.root
        .findByType('input')
        .props.onChange({ target: { value: 'Entered text' } })
    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(handleChange.mock.calls[0][0]).toBe('Entered text')
    searchbar.root.findByType('input').props.onKeyUp({ keyCode: 13 })
    expect(performSearch).toHaveBeenCalledTimes(1)
    searchbar.root
        .findByType('input')
        .props.onKeyUp({ keyCode: 'anything else' })
    expect(performSearch).toHaveBeenCalledTimes(1)
})

test('Matches onclick test', () => {
    const handleChange = jest.fn(() => {})
    const performSearch = jest.fn(() => {})
    const searchbar = renderer.create(
        <SearchBar
            handleChange={handleChange}
            performSearch={performSearch}
            matches={['match1', 'match2']}
        />
    )
    searchbar.root.findAllByType('li')[0].props.onClick()
    expect(handleChange).toHaveBeenCalledTimes(1)
    expect(performSearch).toHaveBeenCalledTimes(1)
    expect(handleChange.mock.calls[0][0]).toBe('match1')
    expect(performSearch.mock.calls[0][0]).toBe('match1')
})

test('Named search Bar', async () => {
    let searchbar
    const value = 'test'
    const emptyFunction = jest.fn(() => {})
    const name = 'a'
    const names = ['a', 'b', 'c']
    await act(async () => {
        searchbar = renderer.create(
            <NamedSearchBar
                value={value}
                name={name}
                names={names}
                setValue={emptyFunction}
                setName={emptyFunction}
                performSearch={emptyFunction}
                handleChange={emptyFunction}
            />
        )
    })
    expect(searchbar).toMatchSnapshot()
})
