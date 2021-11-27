import React from 'react'
import {FlexContainer, FlexContainerCentered, FlexWrap, VerticalLayout, HorizontalLayout} from '../Display'
import renderer from 'react-test-renderer'

test('No undefined inputs', () => {
    expect(FlexContainer).toBeDefined()
    expect(FlexContainerCentered).toBeDefined()
    expect(FlexWrap).toBeDefined()
    expect(VerticalLayout).toBeDefined()
    expect(HorizontalLayout).toBeDefined()
})

test('FlexContainer Snapshot tests', () => {
    const flexContainer = renderer.create(
        <FlexContainer
            id="FlexContainerId"
            className="customClassName"
            style={{background: 'red'}}>
            This is my child
        </FlexContainer>
    )
    expect(flexContainer.toJSON()).toMatchSnapshot()
    expect(flexContainer.toJSON().props.className).toBe('flex container customClassName')
    expect(flexContainer.toJSON().props.id).toBe('FlexContainerId')
    expect(flexContainer.toJSON().props.style).toEqual({background: 'red'})
    expect(flexContainer.toJSON().children[0]).toBe('This is my child')
})

test('FlexContainerCentered Snapshot tests', () => {
    const flexContainerCentered = renderer.create(
        <FlexContainerCentered
            id="FlexContainerId"
            className="customClassName"
            style={{background: 'red'}}>
            This is my child
        </FlexContainerCentered>
    )
    expect(flexContainerCentered.toJSON()).toMatchSnapshot()
    expect(flexContainerCentered.toJSON().props.className).toBe('flex container flexCenterChildren customClassName')
    expect(flexContainerCentered.toJSON().props.id).toBe('FlexContainerId')
    expect(flexContainerCentered.toJSON().props.style).toEqual({background: 'red'})
    expect(flexContainerCentered.toJSON().children[0]).toBe('This is my child')
})

test('FlexWrap Snapshot tests', () => {
    const flexWrap = renderer.create(
        <FlexWrap
            id="FlexWrapId"
            className="customClassName"
            style={{background: 'red'}}>
            This is my child
        </FlexWrap>
    )
    expect(flexWrap.toJSON()).toMatchSnapshot()
    expect(flexWrap.toJSON().props.className).toBe('flex customClassName')
    expect(flexWrap.toJSON().props.id).toBe('FlexWrapId')
    expect(flexWrap.toJSON().props.style).toEqual({flexWrap: 'wrap', background: 'red'})
    expect(flexWrap.toJSON().children[0]).toBe('This is my child')
})

test('VerticalLayout Snapshot tests', () => {
    const verticalLayout = renderer.create(
        <VerticalLayout
            id="VerticalLayoutId"
            className="customClassName"
            style={{background: 'red'}}>
            This is my child
        </VerticalLayout>
    )
    expect(verticalLayout.toJSON()).toMatchSnapshot()
    expect(verticalLayout.toJSON().props.className).toBe('flexColumn customClassName')
    expect(verticalLayout.toJSON().props.id).toBe('VerticalLayoutId')
    expect(verticalLayout.toJSON().props.style).toEqual({alignItems: 'center', background: 'red'})
    expect(verticalLayout.toJSON().children[0]).toBe('This is my child')
})

test('HorizontalLayout Snapshot tests', () => {
    const horizontalLayout = renderer.create(
        <HorizontalLayout
            id="HorizontalLayoutId"
            className="customClassName"
            style={{background: 'red'}}>
            This is my child
        </HorizontalLayout>
    )
    expect(horizontalLayout.toJSON()).toMatchSnapshot()
    expect(horizontalLayout.toJSON().props.className).toBe('flex customClassName')
    expect(horizontalLayout.toJSON().props.id).toBe('HorizontalLayoutId')
    expect(horizontalLayout.toJSON().props.style).toEqual({background: 'red'})
    expect(horizontalLayout.toJSON().children[0]).toBe('This is my child')
})