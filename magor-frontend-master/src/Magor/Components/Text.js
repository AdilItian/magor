import React from 'react'
import cx from '../Utils/cx'
import './css/Text.css'
import shouldHighlight from '../Utils/shouldHighlight'

const highlightQuery = (displaySentence, querySentence) => {
    if (!querySentence) return displaySentence
    const displayWords = displaySentence.split(' ')
    const queryWords = querySentence.split(' ')
    const finalWords = []
    let _key = 0;
    for (let displayWord of displayWords) {
        let highlighted
        if (shouldHighlight(displayWord, queryWords)) {
            highlighted = true
        }
        finalWords.push(
            highlighted ? (
                <span className="highlighted" key={_key++}>
                    {displayWord}
                </span>
            ) : (
                `${displayWord} `
            )
        )
    }
    return finalWords
}

export const Title = (props) => {
    const { query, text, small, thin, ...otherProps } = props
    const titleText = true
    return (
        <h1 className={cx({ titleText, small, thin })} {...otherProps}>
            {highlightQuery(text, query)}
        </h1>
    )
}

export const Para = (props) => {
    if (props.query) {
        return (
            <p {...props} className={cx(['font', props.className])}>
                {highlightQuery(props.text, props.query)}
            </p>
        )
    }
    return (
        <p
            {...props}
            className={cx(['font', props.className])}
            style={props.style}
        >
            {props.text || props.children}
        </p>
    )
}

export const BlockLink = (props) => (
    <a
        href={props.href}
        className={cx('blockLink', props.className)}
        style={props.style}
    >
        {props.children}
    </a>
)

export const Tag = ({ name, showCross, queryWords, ...otherProps }) => (
    <span
        {...otherProps}
        className={cx({
            font: true,
            tag: true,
            highlighted: shouldHighlight(name, queryWords),
            showCross: showCross === true,
            action: !!otherProps.onClick,
        })}
    >
        {name}
    </span>
)
