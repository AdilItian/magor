import React from 'react'
import { Tag, BlockLink, Para, Title } from '../Text'
import renderer from 'react-test-renderer'

test('All should be defined', () => {
    expect(Tag).toBeDefined()
    expect(BlockLink).toBeDefined()
    expect(Para).toBeDefined()
    expect(Title).toBeDefined()
})

test('Tag snapshot tests', () => {
    const basicTag = renderer.create(<Tag name="tag" />)
    expect(basicTag.toJSON()).toMatchSnapshot()
    const tagWithCross = renderer.create(<Tag name="tag" showCross />)
    expect(tagWithCross.toJSON()).toMatchSnapshot()
    const highlightedTag = renderer.create(
        <Tag name="tag" queryWords={['tag']} />
    )
    expect(highlightedTag.toJSON()).toMatchSnapshot()
})

test('BlockLink snapshot tests', () => {
    const blockLink = renderer.create(
        <BlockLink href="#">
            <div>This is a BlockLink</div>
        </BlockLink>
    )
    expect(blockLink.toJSON()).toMatchSnapshot()

    const blockLinkWithStyle = renderer.create(
        <BlockLink href="#" style={{ background: 'blue' }}>
            <div>This is a BlockLink with blue background</div>
        </BlockLink>
    )
    expect(blockLinkWithStyle.toJSON()).toMatchSnapshot()
})

test('Para snapshot tests', () => {
    const para = renderer.create(
        <Para className="customClass" style={{ fontWeight: 'bold' }}>
            This is a paragraph.
        </Para>
    )
    expect(para.toJSON()).toMatchSnapshot()

    const paraWithQuery = renderer.create(
        <Para
            className="customClass"
            style={{ fontWeight: 'bold' }}
            query="random query"
            text="This is a paragraph."
        />
    )
    expect(paraWithQuery.toJSON()).toMatchSnapshot()

    const paraWithMatchingQuery = renderer.create(
        <Para
            className="customClass"
            style={{ fontWeight: 'bold' }}
            query="mathing query paragraph"
            text="This is a paragraph."
        />
    )
    expect(paraWithMatchingQuery.toJSON()).toMatchSnapshot()
})

test('Title snapshot tests', () => {
    const title = renderer.create(<Title text="this is a title" />)
    expect(title.toJSON()).toMatchSnapshot()
    expect(title.toJSON().props.className).toBe('titleText')

    const titleSmall = renderer.create(<Title small text="this is a title" />)
    expect(titleSmall.toJSON()).toMatchSnapshot()
    expect(titleSmall.toJSON().props.className).toBe('titleText small')

    const titleThin = renderer.create(<Title thin text="this is a title" />)
    expect(titleThin.toJSON()).toMatchSnapshot()
    expect(titleThin.toJSON().props.className).toBe('titleText thin')

    const titleWithQuery = renderer.create(
        <Title query="random query" text="this is a title" />
    )
    expect(titleWithQuery.toJSON()).toMatchSnapshot()
    expect(titleWithQuery.toJSON().props.className).toBe('titleText')

    const titleWithMatchingQuery = renderer.create(
        <Title query="matching title query" text="this is a title" />
    )
    expect(titleWithMatchingQuery.toJSON()).toMatchSnapshot()
    expect(titleWithMatchingQuery.root.findByProps({className: 'highlighted'}).children[0]).toBe('title')
})
