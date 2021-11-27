import React from 'react'
import './css/Display.css'
import cx from '../Utils/cx'

export const FlexContainer = (props) => (
    <div
        className={cx(...['flex', 'container', props.className])}
        id={props.id}
        style={{ ...props.style }}
    >
        {props.children}
    </div>
)

export const FlexWrap = (props) => (
    <div
        className={cx(['flex', props.className])}
        id={props.id}
        style={{ flexWrap: 'wrap', ...props.style }}
    >
        {props.children}
    </div>
)

export const FlexContainerCentered = (props) => (
    <div
        className={cx([
            'flex',
            !props.stretch && 'container',
            'flexCenterChildren',
            props.className,
        ])}
        id={props.id}
        style={{ ...props.style }}
    >
        {props.children}
    </div>
)

export const VerticalLayout = (props) => (
    <div
        className={cx(['flexColumn', props.className])}
        id={props.id}
        style={{ alignItems: 'center', ...props.style }}
    >
        {props.children}
    </div>
)

export const HorizontalLayout = (props) => (
    <div
        className={cx(['flex', props.className])}
        id={props.id}
        style={props.style}
    >
        {props.children}
    </div>
)
