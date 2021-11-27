import React from 'react'
import { act, create } from 'react-test-renderer'
import {
    IconSelect,
    DropDown,
    LabelledInput,
    TagsInput,
    FileInput,
    Button,
    TranscriptsInput,
} from '../Inputs'
import { Tag } from '../Text'
import { asrLanguages } from '../../Utils/ASRConfig'

test('No undefined', () => {
    expect(IconSelect).toBeDefined()
    expect(DropDown).toBeDefined()
    expect(LabelledInput).toBeDefined()
    expect(TagsInput).toBeDefined()
    expect(FileInput).toBeDefined()
    expect(Button).toBeDefined()
    expect(TranscriptsInput).toBeDefined()
})

test('Icon Select tests', async () => {
    /* Initialization */
    const fn = () => {}
    let onChange = jest.fn(fn)
    const list = ['item1', 'item2']
    let select
    /* -------------- */

    /* Make sure invalid props render null */
    const invalidPropsArray = [
        {},
        { onChange: fn },
        { list: [] },
        { onChange: fn, list: 123 },
        { onChange: 123, list: [] },
    ]
    for (let invalidProps of invalidPropsArray) {
        let select
        await act(async () => {
            select = create(<IconSelect {...invalidProps} />)
        })
        expect(select.toJSON()).toBeNull()
    }
    /* ----------------------------------- */

    /* Make sure a basic IconSelect renders */
    await act(async () => {
        select = create(<IconSelect list={list} onChange={onChange} />)
    })
    expect(select.toJSON()).toMatchSnapshot()
    /* ------------------------------------ */

    /* make sure onClick works correctly */
    await act(async () => {
        select.root
            .findAllByType('li')
            .filter((li) => li.children[0].match('item1'))[0]
            .props.onClick({
                target: {
                    getAttribute: () => 'item1',
                },
            })
    })
    expect(onChange).toHaveBeenCalledTimes(1)
    expect(onChange.mock.calls[0][0]).toBe('item1')
    /* -------------------------------- */

    /* Make sure value prop works */
    await act(async () => {
        select.update(
            <IconSelect value="item1" list={list} onChange={onChange} />
        )
    })
    expect(select.root.findByType('label').children[0]).toBe('item1')
    /* -------------------------- */

    /* Make sure value=NONE selects nothing */
    await act(async () => {
        select.update(
            <IconSelect value="NONE" list={list} onChange={onChange} />
        )
    })
    expect(select.root.findByType('label').children).toHaveLength(0)
    /* ------------------------------------ */
})

test('DropDown tests', async () => {
    /* Initialization */
    const stringList = ['item1', 'item2']
    const objList = [
        { k: 'item1', v: 'Item One' },
        { k: 'item2', v: 'Item Two' },
    ]
    const selected = 'item1'
    const _key = 'k'
    const setSelected = jest.fn(() => {})
    let dropDown
    /* -------------- */

    /* Make sure invalid props render null */
    const invalidPropsArray = [
        {},
        { setSelected },
        { selected },
        { list: stringList, selected },
        { list: stringList, selected, setSelected: 123 },
        { list: 123, setSelected, selected },
        { list: objList, setSelected, selected },
        { list: objList, setSelected, _key: 'invalidIndex', selected },
        { list: stringList, setSelected },
        { list: objList, setSelected },
    ]
    for (let invalidProps of invalidPropsArray) {
        let dropDown
        await act(async () => {
            dropDown = create(<DropDown {...invalidProps} />)
        })
        expect(dropDown.toJSON()).toBeNull()
    }
    /* ----------------------------------- */

    /* Make sure dropdown is rendered correctly */
    await act(async () => {
        dropDown = create(
            <DropDown
                list={stringList}
                setSelected={setSelected}
                selected={selected}
            />
        )
    })
    expect(dropDown.root.findByType('p').children).toContain('item1')
    expect(dropDown.toJSON()).toMatchSnapshot()
    /* ---------------------------------------- */

    /* Make sure click works */
    await act(async () => {
        dropDown.root
            .findAllByType('li')
            .filter((li) => li.children[0].match('item2'))[0]
            .props.onClick()
    })
    expect(setSelected).toHaveBeenCalledTimes(1)
    expect(setSelected.mock.calls[0][0]).toBe('item2')
    /* --------------------- */

    /* Make sure selected works */
    await act(async () => {
        dropDown.update(
            <DropDown
                list={stringList}
                setSelected={setSelected}
                selected="item2"
            />
        )
    })
    expect(dropDown.root.findByType('p').children).toContain('item2')
    /* ------------------------ */

    /* Make sure object lists work */
    await act(async () => {
        dropDown = create(
            <DropDown
                list={objList}
                _key={_key}
                setSelected={setSelected}
                selected={selected}
            />
        )
    })
    expect(dropDown.toJSON()).not.toBeNull()
    expect(dropDown.root.findByType('p').children).toContain(selected)
    expect(dropDown.toJSON()).toMatchSnapshot()
    /* --------------------------- */
})

test('LabelledInput Tests', async () => {
    /* Initialization */
    const setValue = jest.fn(() => {})
    let input
    /* -------------- */

    /* Make sure inalid props render null */
    await act(async () => {
        input = create(<LabelledInput />) // setValue must not be null!
    })
    expect(input.toJSON()).toBeNull()
    /* ---------------------------------- */

    /* Make sure input type defaults to text and renders */
    await act(async () => {
        input = create(<LabelledInput setValue={setValue} />)
    })
    expect(input.root.findByType('input').props.type).toBe('text')
    /* ------------------------------------------------- */

    /* Make sure inpute type can be changed with props */
    await act(async () => {
        input = create(<LabelledInput type="email" setValue={setValue} />)
    })
    expect(input.root.findByType('input').props.type).toBe('email')
    /* ----------------------------------------------- */

    /* Make sure textareas are dealt with correctly */
    await act(async () => {
        input = create(<LabelledInput type="textarea" setValue={setValue} />)
    })
    expect(input.root.findByType('textarea')).not.toBeNull()
    /* -------------------------------------------- */

    /* Make sure labels are rendered */
    await act(async () => {
        input = create(<LabelledInput label="MyLabel" setValue={setValue} />)
    })
    expect(input.root.findByType('label').children[0]).toBe('MyLabel')
    /* ----------------------------- */

    /* Make sure validator errors are rendered correctly */
    await act(async () => {
        input = create(
            <LabelledInput
                validator={() => Promise.reject({ message: 'MyError' })}
                setValue={setValue}
            />
        )
    })
    await act(async () => {
        input.root
            .findByType('input')
            .props.onChange({ target: { value: 'Some text' } })
    })
    expect(input.root.findByType('b').children).toContain('MyError')
    expect(setValue).toHaveBeenCalledTimes(1)
    expect(setValue.mock.calls[0][0]).toBe('Some text')
    /* ------------------------------------------------- */
})

test('TagsInput tests', async () => {
    /* Initialization */
    const tags = ['tag1', 'tag2']
    const setTags = jest.fn((cb) => cb(tags))
    let input
    /* -------------- */

    /* Make sure invalid props render null */
    const invalidPropsArray = [
        {},
        { tags },
        { setTags },
        { tags: 123, setTags },
        { tags, setTags: 123 },
    ]
    for (let invalidProps of invalidPropsArray) {
        let input
        await act(async () => {
            input = create(<TagsInput {...invalidProps} />)
        })
        expect(input.toJSON()).toBeNull()
    }
    /* ----------------------------------- */

    /* Make sure tags are represented in the output correctly */
    await act(async () => {
        input = create(<TagsInput tags={[]} setTags={setTags} />)
    })
    expect(input.root.findAllByType(Tag)).toHaveLength(0)

    await act(async () => {
        input = create(<TagsInput tags={tags} setTags={setTags} />)
    })
    expect(input.root.findAllByType(Tag).map((tag) => tag.props.name)).toEqual(
        tags
    )
    /* ------------------------------------------------------ */

    /* Make sure the remove tag functionality works */
    await act(async () => {
        const tag1 = input.root.findAllByType(Tag)[0]
        tag1.props.onClick({
            currentTarget: { getAttribute: () => tag1.props._key },
        })
    })
    expect(setTags).toHaveBeenCalledTimes(1)
    expect(setTags.mock.results[0].value).toEqual(['tag2'])
    /* -------------------------------------------- */

    /* Make sure the tag is added on Blur */
    await act(async () => {
        input.root
            .findByType('input')
            .props.onChange({ target: { value: 'tag3' } })
    })
    await act(async () => {
        input.root.findByType('input').props.onBlur()
    })
    expect(setTags).toHaveBeenCalledTimes(2)
    expect(setTags.mock.results[1].value).toEqual([...tags, 'tag3'])
    /* ---------------------------------- */

    /* Make sure the tag is added on pressing enter key */
    await act(async () => {
        input.root
            .findByType('input')
            .props.onChange({ target: { value: 'tag3' } })
    })
    await act(async () => {
        input.root.findByType('input').props.onKeyUp({ which: 13 })
    })
    expect(setTags).toHaveBeenCalledTimes(3)
    expect(setTags.mock.results[2].value).toEqual([...tags, 'tag3'])
    /* ------------------------------------------------ */
})

test('FileInput tests', async () => {
    /* Initialization */
    const setFile = jest.fn(() => {})
    const chooseFile = jest.fn(() => {})
    const positiveValidator = jest.fn(() => Promise.resolve('MyValid'))
    const negativeValidator = jest.fn(() => Promise.reject('MyError'))
    const file = { name: 'file.txt' }
    const refProp = {
        _ref: {
            current: {
                files: [file],
                click: chooseFile,
            },
        },
    }

    let input
    /* ----------- */

    /* Make sure incomplete props render null */
    await act(async () => {
        input = create(<FileInput />)
    })
    expect(input.toJSON()).toBeNull()

    await act(async () => {
        input = create(<FileInput setFile={123} />)
    })
    expect(input.toJSON()).toBeNull()
    /* -------------------------------------- */

    /* Make sure the File Upload Button works */
    await act(async () => {
        input = create(<FileInput setFile={setFile} {...refProp} />)
    })
    await act(async () => {
        input.root.findByType('button').props.onClick()
    })
    expect(chooseFile).toHaveBeenCalledTimes(1)
    /* -------------------------------------- */

    /* Make sure setFile is called when input changes */
    await act(async () => {
        input.root.findByType('input').props.onChange()
    })
    expect(setFile).toHaveBeenCalledTimes(1)
    expect(setFile.mock.calls[0][0]).toEqual(file)
    /* ----------------------------------------------- */

    /* Make sure validators are being called */
    await act(async () => {
        input = create(
            <FileInput
                setFile={setFile}
                {...refProp}
                validator={positiveValidator}
            />
        )
    })
    await act(async () => {
        input.root.findByType('input').props.onChange()
    })
    expect(positiveValidator).toHaveBeenCalledTimes(1)
    expect(positiveValidator.mock.calls[0][0]).toEqual(file)
    expect(setFile).toHaveBeenCalledTimes(2)
    expect(setFile.mock.calls[1][0]).toEqual(file)
    /* ------------------------------------- */

    /* Test the rejected validator */
    await act(async () => {
        input = create(
            <FileInput
                setFile={setFile}
                {...refProp}
                validator={negativeValidator}
            />
        )
    })
    await act(async () => {
        input.root.findByType('input').props.onChange()
    })
    expect(negativeValidator).toHaveBeenCalledTimes(1)
    expect(negativeValidator.mock.calls[0][0]).toEqual(file)
    expect(setFile).toHaveBeenCalledTimes(3)
    /* --------------------------- */
})

test('Button tests', async () => {
    /* Initialization */
    const onClick = jest.fn(() => {})
    let button
    /* -------------- */

    /* Basic snapshot test */
    await act(async () => {
        button = create(<Button />)
    })
    expect(button.toJSON()).not.toBeNull()
    expect(button.toJSON()).toMatchSnapshot()
    /* ------------------- */

    /* Make sure click works */
    await act(async () => {
        button = create(<Button onClick={onClick} />)
    })
    await act(async () => {
        button.root.props.onClick()
    })
    expect(onClick).toHaveBeenCalledTimes(1)
    /* --------------------- */

    /* Make sure classes are forwarded */
    await act(async () => {
        button = create(<Button className="MyClassName" />)
    })
    expect(
        button.root.findByType('button').props.className.split(' ')
    ).toContain('MyClassName')
    /* ------------------------------- */
})

test('Transcripts Input tests', async () => {
    let transcripts = [{ _id: 't0', path: '/some/path.xml', name: 'Name' }]
    const setTranscripts = jest.fn(
        (transcriptGen) => (transcripts = transcriptGen(transcripts))
    )

    let input
    await act(async () => {
        input = await create(
            <TranscriptsInput
                transcripts={transcripts}
                setTranscripts={setTranscripts}
            />
        )
    })
    expect(input).toMatchSnapshot()

    const addTranscriptButton = input.root.findByProps({
        className: 'transcriptInput addTranscript',
    })
    await act(async () => {
        addTranscriptButton.props.onClick()
        input.update(
            <TranscriptsInput
                transcripts={transcripts}
                setTranscripts={setTranscripts}
            />
        )
    })
    expect(transcripts).toHaveLength(2)
    expect(input).toMatchSnapshot()

    const newTranscriptName = input.root.findByProps({
        className: 'labelledInput',
    })
    await act(async () => {
        newTranscriptName.props.onChange({ target: { value: 'New Name' } })
        input.update(
            <TranscriptsInput
                transcripts={transcripts}
                setTranscripts={setTranscripts}
            />
        )
    })
    expect(setTranscripts).toHaveBeenCalledTimes(2)
    expect(input).toMatchSnapshot()

    const makeNewTranscriptDefaultButton = input.root.findByProps({
        className: 'makeDefault',
    })
    await act(async () => {
        makeNewTranscriptDefaultButton.props.onClick()
        input.update(
            <TranscriptsInput
                transcripts={transcripts}
                setTranscripts={setTranscripts}
            />
        )
    })
    expect(input).toMatchSnapshot()

    const removeNewTranscriptButton = input.root.findAllByProps({
        className: 'remove',
    })[1]
    await act(async () => {
        removeNewTranscriptButton.props.onClick()
        input.update(
            <TranscriptsInput
                transcripts={transcripts}
                setTranscripts={setTranscripts}
            />
        )
    })
    expect(transcripts).toHaveLength(1)
    expect(input).toMatchSnapshot()
})

test('Transcripts Input tests with ASR', async () => {
    let transcripts = [
        { _id: 't0', path: '/some/path.xml', name: 'Name' },
        { _id: 't1', isNew: true, name: 'v2' },
    ]
    const setTranscripts = jest.fn(
        (transcriptGen) => (transcripts = transcriptGen(transcripts))
    )

    let input
    await act(async () => {
        input = await create(
            <TranscriptsInput
                transcripts={transcripts}
                setTranscripts={setTranscripts}
                allowASR
            />
        )
    })
    expect(input).toMatchSnapshot()

    const useASRButton = input.root.findByProps({
        className: 'useASR',
    })
    await act(async () => {
        useASRButton.props.onClick()
        input.update(
            <TranscriptsInput
                transcripts={transcripts}
                setTranscripts={setTranscripts}
                allowASR
            />
        )
    })
    expect(transcripts[1].shouldUseASR).toBe(true)
    expect(transcripts[1].asrLanguage).toEqual(asrLanguages[0])
    expect(input).toMatchSnapshot()

    const secondLanguage = input.root.findAllByType('li')[0]
    await act(async () => {
        secondLanguage.props.onClick()
        input.update(
            <TranscriptsInput
                transcripts={transcripts}
                setTranscripts={setTranscripts}
                allowASR
            />
        )
    })
    expect(transcripts[1].shouldUseASR).toBe(true)
    expect(transcripts[1].asrLanguage).toEqual(asrLanguages[1])
    expect(input).toMatchSnapshot()

    const uploadOwnButton = input.root.findByProps({
        className: 'uploadOwnTranscript',
    })
    await act(async () => {
        uploadOwnButton.props.onClick()
        input.update(
            <TranscriptsInput
                transcripts={transcripts}
                setTranscripts={setTranscripts}
                allowASR
            />
        )
    })
    expect(transcripts[1].shouldUseASR).toBe(false)
    expect(input).toMatchSnapshot()
})
