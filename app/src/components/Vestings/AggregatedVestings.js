import React from 'react'
import {
    formatTokenAmount,
    LineChart,
} from '@aragon/ui'

const CLIFF = 90
const DAY = 1000 * 60 * 60 * 24
const TOTAL_PERIOD = 450

// Get the end date of the vesting that will end the last.
const getLatestDate = (vestings) => {
    let latestEndDate = 0
    Object.keys(vestings).forEach((key) => {
        const endDate = vestings[key][0].data.vesting
        if (endDate.getTime() > latestEndDate) latestEndDate = endDate
    })
    return latestEndDate
}

// Get the earliest vesting start date.
const getEarliestDate = (vestings) => {
    let earliestDate = Number.MAX_SAFE_INTEGER
    Object.keys(vestings).forEach((key) => {
        const startDate = vestings[key][0].data.start
        if (startDate.getTime() < earliestDate) earliestDate = startDate
    })
    return earliestDate
}

// Calculate the total time period between the start and end date, and split into 100 dates.
const getTimeDates = (startDate, endDate) => {
    let differenceDates = (endDate.getTime() - startDate.getTime())
    let dates = []
    let step = (differenceDates / 99)
    for (var i = 0; i <= differenceDates; i += step) {
        const newDate = new Date(startDate.getTime() + i)
        dates.push(newDate)
    }
    if (dates.length == 99) dates.push(endDate)
    return dates
}


// Calculate the current amount of locked tokens for one address on a given date. 
const calculateCurrentTokens = (vestings, address, date, tokenDecimals) => {
    const startDate = vestings[address][0].data.start
    const differenceDays = (date.getTime() - startDate.getTime()) / DAY
    let currentTokens = 0

    if (differenceDays < TOTAL_PERIOD && differenceDays >= 0) {
        const bigNumAmount = vestings[address][0].data.amount
        const amount = parseInt(formatTokenAmount(bigNumAmount, tokenDecimals))
        currentTokens = differenceDays < CLIFF ? amount : (amount - ((1 / TOTAL_PERIOD) * differenceDays * amount))
    }
    return currentTokens
}

// Aggregate the amount of locked tokens per address during different moments of time
const aggregateVestings = (vestings, tokenDecimals) => {
    const startDate = getEarliestDate(vestings)
    const endDate = getLatestDate(vestings)
    const dates = getTimeDates(startDate, endDate)
    let accumulation = {}

    dates.forEach(date => accumulation[date] = 0)
    Object.keys(vestings).forEach((key) => {
        dates.forEach(date => accumulation[date] += calculateCurrentTokens(vestings, key, date, tokenDecimals))
    })

    const accumulationsArray = Object.values(accumulation)
    const accumulationsScaled = accumulationsArray.map((value) => {
        return value / (Math.max(...accumulationsArray))
    })
    return accumulationsScaled
}

function AggregatedVestings({
    vestings,
    tokenDecimals,
}) {
    const accumulations = aggregateVestings(vestings, tokenDecimals)
    const startDate = getEarliestDate(vestings)
    const endDate = getLatestDate(vestings)
    return (
        <div>
            <LineChart
                lines={[accumulations]}
                springConfig={{ mass: 0.5, tension: 120, friction: 80 }}
                label={null}
                height={90}
                color={() => `#03b3ff`}
                dotRadius={0}
                label={index => index == 0 ? startDate.toDateString() : index == 99 ? endDate.toDateString() : null}
            />
        </div>
    )
}

export default AggregatedVestings