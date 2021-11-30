import React from 'react'
import { DropDown } from './Inputs'
import './css/Search.css'
import cx from '../Utils/cx'

export const SearchBar = (props) => {
    const handleKeyUp = (e) => {
        if (e.keyCode === 13) {
            props.performSearch()
        }
    }
    const matches = (props.matches || []).filter((m) => m !== props.value)
    if (typeof props.performSearch !== 'function') return null
    if (typeof props.handleChange !== 'function') return null
    return (
        <div className="searchBarContainer">
            <input
                type="text"
                name="search"
                placeholder={props.placeholder || 'Enter search query here'}
                onKeyUp={handleKeyUp}
                onChange={(e) => props.handleChange(e.target.value)}
                value={props.value || ''}
                className={`font searchBar ${props.small ? 'small' : ''}`}
                style={props.style}
            />
            {matches.length > 0 && (
                <ul>
                    {matches.map((li) => (
                        <li
                            key={li}
                            onClick={(_) => {
                                props.handleChange(li)
                                props.performSearch(li)
                            }}
                        >
                            {li}
                        </li>
                    ))}
                </ul>
            )}
        </div>
    )
}

export const SearchButton = (props) => {
    return typeof props.performSearch !== 'function' ? null : (
        <button
            onClick={props.performSearch}
            className={`searchButton ${props.small ? 'small' : ''}`}
            style={props.style}
        />
    )
}

export const NamedSearchBar = (props) => {
    return (
        <>
            <SearchBar
                value={props.value}
                performSearch={props.performSearch}
                handleChange={props.handleChange}
                small={props.small}
            />
            <div
                id="SearchName"
                className={cx({
                    hidden: props.value === '',
                    small: props.small,
                })}
            >
                <DropDown
                    small={props.small}
                    selected={props.name}
                    list={props.names}
                    setSelected={props.setName}
                />
            </div>
        </>
    )
}
