import React, { useState, useEffect } from 'react'
import { useHistory } from 'react-router-dom'

import {
    FlexContainerCentered,
    VerticalLayout,
    LabelledInput,
} from './Components/'
import { Title, NamedSearchBar, SearchButton } from './Components/'
import { UserDropdown } from './Components/AuthElements'

import { QueryParams, queryParamNames } from './Utils/queryParams'

import './index.css'

let queryParams = new QueryParams()
const { TEXT } = queryParamNames

const newField = (name) => {
    if (queryParams.getParam(name) !== null) return false
    queryParams.setParam(name, '')
    return {
        name,
        value: '',
    }
}

const setName = (setState, index) => (name) =>
    setState((i) => {
        if (queryParams.getParam(name) !== null) return i
        queryParams.setParam(name, i[index].value)
        queryParams.setParam(i[index].name, null)
        const newState = [...i]
        newState[index].name = name
        return newState
    })

const setValue = (setState, index) => (value) =>
    setState((i) => {
        queryParams.setParam(i[index].name, value)
        const newState = [...i]
        newState[index].value = value
        return newState
    })

const Magor = () => {
    const history = useHistory()
    const [fields, setFields] = useState()
    useEffect(() => {
        queryParams = new QueryParams()
        setFields([newField(TEXT)])
        document.title = "Magor"
    }, [])

    const performSearch = () =>
        history.push(`/search/${queryParams.toQueryString()}`)

    const addField = (name) => {
        setFields((f) => {
            return [...f, newField(name)]
        })
    }

    if (!fields) return null

    return (
        <div id="Magor">
            <div id="LoginBar">
                <UserDropdown />
            </div>
            <FlexContainerCentered>
                <VerticalLayout style={{ height: 300 }}>
                    <Title thin text="Magor" />
                    <div style={{ position: 'relative', display: 'flex' }}>
                        <NamedSearchBar
                            names={Object.keys(queryParamNames)}
                            name={fields[0].name}
                            setName={setName(setFields, 0)}
                            value={fields[0].value}
                            performSearch={performSearch}
                            handleChange={setValue(setFields, 0)}
                        />
                        <SearchButton performSearch={performSearch} />
                    </div>
                    {fields.slice(1).map((f, i) => (
                        <LabelledInput
                            key={i}
                            label={f.name.toLowerCase()}
                            value={fields[i + 1].value}
                            setValue={setValue(setFields, i + 1)}
                        />
                    ))}
                    <AddFields
                        isVisible={fields[0].value !== ''}
                        empty={queryParams.empty}
                        addField={addField}
                    />
                </VerticalLayout>
            </FlexContainerCentered>
        </div>
    )
}

const AddFields = (props) => {
    if (!props.isVisible) return null
    if (props.empty.length === 0) return null
    return (
        <p id="AddFilters">
            Add Filters:{' '}
            {props.empty.map((e) => (
                <button
                    key={e}
                    className="addFilterButton"
                    onClick={() => props.addField(e)}
                >
                    {e.toLowerCase()}
                </button>
            ))}
        </p>
    )
}

export default Magor
