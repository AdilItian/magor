export const emotions = {
    ANGER: { name: 'Anger', emoji: '😡', color: 'red' },
    HAPPINESS: { name: 'Happiness', emoji: '😃', color: 'green' },
    SADNESS: { name: 'Sadness', emoji: '😢', color: 'blue' },
    LOVE: { name: 'Love', emoji: '\u2764\uFE0F', color: '#d40c98' },
}

const getEmotion = (emotion) => {
    if (emotions.hasOwnProperty(emotion)) {
        return emotions[emotion]
    }
    return {
        name: 'Unknown',
        emoji: '❓',
    }
}

export default getEmotion
