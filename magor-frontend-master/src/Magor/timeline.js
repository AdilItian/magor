const EVENT_START = 1
const EVENT_END = -1

class Timeline {
    constructor() {
        this.timeline = {
            0: {
                type: 0,
                key: 'DUMMY.EVENT',
            },
        }
        this.currentSeek = 0
        this.lastTrigger = undefined
        this.lastSeekDirWasForward = false
    }
    add(startTimeMs, endTimeMs, key) {
        while (this.timeline[startTimeMs]) startTimeMs++
        while (this.timeline[endTimeMs]) endTimeMs++
        this.timeline[startTimeMs] = {
            type: EVENT_START,
            key,
        }
        this.timeline[endTimeMs] = {
            type: EVENT_END,
            key,
        }
    }
    findClosestLower(x, arr) {
        const satisfiesCond = (i) => {
            if (arr[i] === x) return true
            if (arr[i] > x) return false
            if (i === arr.length - 1) return true
            if (arr[i + 1] > x) return true
            return false
        }
        let start = 0
        let end = arr.length - 1
        let mid
        while (start <= end) {
            mid = Math.floor((start + end) / 2)
            if (satisfiesCond(mid)) return arr[mid]
            else if (arr[mid] < x) start = mid + 1
            else end = mid - 1
        }
    }
    seekToAndGetDiff(seekTo) {
        const keys = Object.keys(this.timeline)
        let k
        for (k in keys) keys[k] = parseInt(keys[k])

        let start = this.lastTrigger || 0
        let end = this.findClosestLower(seekTo, keys)
        const isReverse = start > end
        const diff = {}
        let temp
        for (
            k = keys.indexOf(Math.min(start, end));
            k <= keys.indexOf(Math.max(start, end));
            k++
        ) {
            if (
                this.lastSeekDirectionWasReverse ^ isReverse &&
                keys[k] === this.lastTrigger
            )
                continue
            temp = this.timeline[keys[k]]
            const multiplier = isReverse ? -1 : 1
            if (temp.type === 0) continue
            if (diff[temp.key]) delete diff[temp.key]
            else diff[temp.key] = multiplier * temp.type
        }
        this.lastTrigger = end
        this.currentSeek = seekTo
        this.lastSeekDirectionWasReverse = !isReverse
        return diff
    }
}

export default Timeline
