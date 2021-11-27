import React, { useState, useCallback, useRef } from 'react'
import cx from '../Utils/cx'

import { Tag } from './Text'
import { FlexContainerCentered } from './Display'
import { transcriptValidator } from '../Utils/uploadInputValidators'
import { asrLanguages } from '../Utils/ASRConfig'
import { ContextMenu, MenuItem, ContextMenuTrigger } from 'react-contextmenu'

import './css/input.css'
import './css/ContextMenu.css'

export const IconSelect = (props) => {
    const { iconUrl, onChange, value, list } = props
    const handleOnClick = (e) => {
        onChange(e.target.getAttribute('tl'))
    }
    if (typeof onChange !== 'function' || !Array.isArray(list)) return null
    return (
        <div className="iconSelectContainer">
            <div
                className="iconSelectIcon"
                style={{ backgroundImage: `url(${iconUrl})` }}
            />
            <label>{value === 'NONE' ? null : value || null}</label>
            <ul className="iconSelectList">
                {list.map((li) => (
                    <li onClick={handleOnClick} tl={li} key={li}>
                        {li}
                    </li>
                ))}
            </ul>
        </div>
    )
}

const canvas = document.createElement('canvas')
const getTextWidth = (text, white) => {
    if (process.env.JEST_WORKER_ID !== undefined) return 200
    const context = canvas.getContext('2d')
    const fontSize = white ? 14 : 16
    context.font = `normal ${fontSize}pt Roboto`
    const metrics = context.measureText(text)
    return metrics.width
}

export const DropDown = (props) => {
    const { list, selected, setSelected, _key: key, white, small } = props
    if (
        !Array.isArray(list) ||
        selected == null ||
        typeof setSelected !== 'function'
    )
        return null
    if (list.length === 0) return null
    if (typeof list[0] === 'object' && !list[0].hasOwnProperty(key))
        return false

    const height = white || small ? 25 : 30
    const filteredList = list.filter((li) =>
        typeof li === 'object' ? li[key] !== selected[key] : li !== selected
    )
    let _key = 0
    const setHeight = (e) => {
        const ul = e.currentTarget.querySelector('ul')
        ul.style.height = 5 + filteredList.length * height + 'px'
    }
    const resetHeight = (e) => {
        const ul = e.currentTarget.querySelector('ul')
        ul.style.height = 0
    }

    // Crazy hackery to find an appropriate width
    // Because elements can't inherit their absolutely
    // positioned children's width
    const elementsToShow = [...list, selected]
    let width = Math.max(
        ...elementsToShow
            .map((li) => li[key] || li)
            .map((li) => getTextWidth(li, white || small))
    )
    width += 20

    return (
        <div
            className={cx({ dropDown: true, white, small })}
            onMouseOver={setHeight}
            onMouseOut={resetHeight}
            style={{ width }}
        >
            <p>
                {selected[key] ||
                    (typeof selected === 'string' ? selected : '-')}
            </p>
            <ul>
                {filteredList.map((li) => (
                    <li key={_key++} onClick={(_) => setSelected(li)}>
                        {li[key] || (typeof selected === 'string' ? li : '-')}
                    </li>
                ))}
            </ul>
        </div>
    )
}

export const LabelledInput = (props) => {
    const {
        validator,
        type = 'text',
        label,
        value = '',
        setValue,
        small,
        labelShown = false,
    } = props
    const [error, setError] = useState(null)
    const handleChange = useCallback(
        async (e) => {
            setValue(e.target.value)
            setError(null)
            if (validator) {
                try {
                    await validator(e.target.value)
                } catch (error) {
                    setError(error.message)
                }
            }
        },
        [setValue, validator]
    )
    let input
    const commonProps = {
        value,
        placeholder: label,
        onChange: handleChange,
    }
    switch (type) {
        case 'textarea':
            input = (
                <textarea className="labelledInput" rows="5" {...commonProps} />
            )
            break
        default:
            input = (
                <input type={type} className="labelledInput" {...commonProps} />
            )
    }
    if (typeof setValue !== 'function') return null
    return (
        <div className={cx({ labelledInputContainer: true, small })}>
            <label
                className={cx({
                    labelledInputLabel: true,
                    active: value.length || labelShown || error != null,
                })}
            >
                {label}
                {error != null && <b> : {error}</b>}
            </label>
            {input}
        </div>
    )
}

export const TagsInput = (props) => {
    const { tags, setTags, placeholder, label, showLabel = true } = props

    const [val, setVal] = useState('')
    const removeTag = useCallback(
        (e) => {
            const index = e.currentTarget.getAttribute('_key')
            setTags((prev) => {
                const newTags = [...prev]
                newTags.splice(index, 1)
                return newTags
            })
        },
        [setTags]
    )

    if (!Array.isArray(tags) || typeof setTags !== 'function') return null

    const createNewTagFromInput = (_) => {
        const newTag = val.replace(',', '').trim()
        if (newTag !== '') setTags((prev) => [...prev, newTag])
        setVal('')
    }
    const handleKeyUp = (e) => {
        if (/(188|13)/.test(e.which)) createNewTagFromInput(e)
        if (e.which === 8 && val.length === 0 && tags.length !== 0)
            setTags((prev) => [...prev.slice(0, prev.length - 1)])
    }
    const focusInput = (e) => e.currentTarget.querySelector('input').focus()

    let _key = 0

    return (
        <div className="labelledInputContainer" onClick={focusInput}>
            {showLabel && (
                <label
                    className={cx({
                        labelledInputLabel: true,
                        active: tags.length || val.length,
                    })}
                >
                    {label}
                </label>
            )}
            <div className="tagsInput">
                {tags.map((t) => (
                    <Tag
                        showCross={true}
                        key={_key}
                        _key={_key++}
                        onClick={removeTag}
                        name={t}
                    />
                ))}
                <input
                    placeholder={tags.length === 0 ? placeholder : ''}
                    type="text"
                    value={val}
                    onChange={(e) => setVal(e.target.value)}
                    onBlur={createNewTagFromInput}
                    onKeyUp={handleKeyUp}
                />
            </div>
        </div>
    )
}

const shortenFileName = (fileName) =>
    fileName
        .split('.')
        .map((f) => f.substr(0, 15))
        .join('.')

export const FileInput = (props) => {
    const { validator, file, setFile, buttonText, small } = props
    const [valid, setValid] = useState(null)
    const [error, setError] = useState(null)
    let ref = useRef()
    let mockRef // use a mock 'ref' for tests
    if (process.env.JEST_WORKER_ID !== undefined) {
        mockRef = props._ref
    }
    const name = file ? shortenFileName(file.name) : 'No File Selected'
    const handleChange = async (_) => {
        const _file = (mockRef || ref).current.files[0]
        if (validator) {
            try {
                setError(null)
                setValid(null)
                const { message } = await validator(_file)
                setValid(message)
                setFile(_file)
            } catch ({ message }) {
                setFile(null)
                setError(message)
            }
        } else {
            setFile(_file)
        }
    }
    if (typeof setFile !== 'function') return null
    return (
        <div className={cx({ fileInput: true, small })} style={props.style}>
            <button
                className={cx({ small })}
                onClick={() => (mockRef || ref).current.click()}
            >
                {buttonText || 'Choose File'}
            </button>
            <p>
                <label>{name}</label>
                {valid && <label className="valid">{valid}</label>}
                {error && <label className="error">{error}</label>}
            </p>
            <br />
            <input type="file" ref={ref} onChange={handleChange} />
        </div>
    )
}

export const Button = ({
    children,
    className,
    small,
    openInNewTabHref,
    ...otherProps
}) => {
    const id = useRef(Math.random() * 100)
    if (openInNewTabHref) {
        return (
            <>
                <ContextMenuTrigger
                    id={String(id.current)}
                    holdToDisplay={1000}
                >
                    <button
                        {...otherProps}
                        className={cx(['button', className, cx({ small })])}
                    >
                        {children}
                    </button>
                </ContextMenuTrigger>
                <ContextMenu id={String(id.current)}>
                    <MenuItem
                        onClick={() => window.open(openInNewTabHref, '_blank')}
                    >
                        Open in new tab
                    </MenuItem>
                </ContextMenu>
            </>
        )
    }
    return (
        <button
            {...otherProps}
            className={cx(['button', className, cx({ small })])}
        >
            {children}
        </button>
    )
}

const Transcript = (props) => {
    const {
        path,
        index,
        isNew,
        makeDefault,
        name,
        file = null,
        asrLanguage = asrLanguages[0],
        shouldUseASR = false,
        setVals,
        validator = transcriptValidator,
        allowASR,
    } = props
    const isDefault = index === 0
    const remove = (_) => props.remove(index)
    const setName = (name) => setVals(index, { name })
    const setFile = (file) => setVals(index, { file })
    const setShouldUseASR = (shouldUseASR) => setVals(index, { shouldUseASR })
    const setAsrLanguage = (asrLanguage, shouldUseASR = true) =>
        setVals(index, { asrLanguage, shouldUseASR })
    if (isNew) {
        return (
            <div className="transcriptInput new">
                <div>
                    <button className="remove" onClick={remove}>
                        x
                    </button>
                    <LabelledInput
                        label="Name"
                        value={name}
                        setValue={setName}
                        small={1}
                    />
                    {isDefault ? (
                        <label className="default">Default</label>
                    ) : (
                        <Button
                            small={1}
                            className="makeDefault"
                            onClick={(_) => makeDefault(index)}
                        >
                            Make Default
                        </Button>
                    )}
                </div>
                <div>
                    {!shouldUseASR ? (
                        <>
                            <FileInput
                                validator={validator}
                                buttonText={
                                    file
                                        ? 'Change Transcript'
                                        : 'Choose Transcript'
                                }
                                file={file}
                                setFile={setFile}
                                small={1}
                            />
                            {allowASR && (
                                <>
                                    <h4>Or</h4>
                                    <div
                                        style={{
                                            display: 'flex',
                                            flexDirection: 'column',
                                        }}
                                    >
                                        <Button
                                            small
                                            style={{ marginBottom: 5 }}
                                            className="useASR"
                                            onClick={() => {
                                                setShouldUseASR(true)
                                                setAsrLanguage(asrLanguages[0])
                                            }}
                                        >
                                            Auto generate transcript
                                        </Button>
                                        <DropDown
                                            white
                                            list={asrLanguages}
                                            _key="key"
                                            selected={asrLanguage}
                                            setSelected={setAsrLanguage}
                                        />
                                    </div>
                                </>
                            )}
                        </>
                    ) : (
                        <FlexContainerCentered
                            style={{ flexDirection: 'column' }}
                        >
                            <label style={{ marginBottom: 5 }}>
                                A transcript will be automatically generated in{' '}
                            </label>
                            <DropDown
                                white
                                list={asrLanguages}
                                _key="key"
                                selected={asrLanguage}
                                setSelected={setAsrLanguage}
                            />
                            <Button
                                small
                                style={{ marginTop: 10 }}
                                onClick={() => setShouldUseASR(false)}
                                className="uploadOwnTranscript"
                            >
                                Or upload your own
                            </Button>
                        </FlexContainerCentered>
                    )}
                </div>
            </div>
        )
    } else {
        let ext = path.match(/[^.]*$/)[0].toUpperCase()
        if (ext === 'JSON' || ext === 'XML') ext = 'ASR' + ext
        return (
            <div className="transcriptInput">
                <button className="remove" onClick={remove}>
                    x
                </button>
                <label>{name || path.match(/[^/]*$/)[0]}</label>
                <label className="ext">{ext}</label>
                {isDefault ? (
                    <label className="default">Default</label>
                ) : (
                    <Button small={1} onClick={(_) => makeDefault(index)}>
                        Make Default
                    </Button>
                )}
            </div>
        )
    }
}

export const TranscriptsInput = (props) => {
    const {
        label = 'Transcripts',
        transcripts,
        setTranscripts,
        validator,
        allowASR = false,
        allowEmpty = false,
    } = props
    let index = 0

    const addTranscript = (_) => {
        setTranscripts((transcripts) => [
            ...transcripts,
            {
                _id: new Date().getTime(),
                isNew: true,
                name: `V${transcripts.length + 1}`,
            },
        ])
    }

    const makeDefault = (index) => {
        setTranscripts((transcripts) => {
            const tx = [...transcripts]
            const defaultTx = tx.splice(index, 1)
            tx.unshift(defaultTx[0])
            return tx
        })
    }

    const remove = (index) => {
        setTranscripts((transcripts) => {
            if (transcripts.length === 1 && !allowEmpty) return transcripts
            const tx = [...transcripts]
            tx.splice(index, 1)
            return tx
        })
    }

    const setVals = (index, vals) => {
        setTranscripts((transcripts) => {
            const tx = [...transcripts]
            tx[index] = { ...tx[index], ...vals }
            return tx
        })
    }
    return (
        <div className="labelledInputContainer">
            <label className="labelledInputLabel active">{label}</label>
            <div className="labelledInput transcriptsInput">
                {transcripts.map((tx) => (
                    <Transcript
                        key={tx._id}
                        index={index++}
                        makeDefault={makeDefault}
                        setVals={setVals}
                        remove={remove}
                        validator={validator}
                        allowASR={allowASR}
                        {...tx}
                    />
                ))}
                <div
                    className="transcriptInput addTranscript"
                    onClick={addTranscript}
                >
                    Add Transcript
                </div>
            </div>
        </div>
    )
}
