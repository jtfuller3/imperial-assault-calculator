import { v4 as uuid } from 'uuid'
import Attack from './Attack'
import PunchDagger from './PunchDagger'
import { getAllOptionalAbilities } from "./optionalAbilityUtilities"
import { ACC, BLACK, DAM, GREEN, WHITE, DICE_MAX, DICE_MIN, SUR, BLO, EVA, DOD } from '../data'

/**
 * Gets either an Attack object, or the subclass PunchDagger object
 * @param {object} unitAttack Data about the unit attack
 * @param {object} attack Data about the attack
 * @param {object?} defense Optional data about the defense (for adding the defense bonus in)
 * @param {number} requiredAccuracy A minimum required accuracy to hit, below which damage is 0
 * @returns {Attack | PunchDagger} Either an Attack or PunchDagger object
 */
export const getAttackObject = (unitAttack, attack, defense, requiredAccuracy) => {
    const args = [
        attack.dice,
        addValues(attack.bonus, defense?.bonus),
        attack.surgeAbilities,
        attack.rerolls,
        requiredAccuracy
    ]
    return (unitAttack?.weapon?.isPunchDagger) ? new PunchDagger(...args) : new Attack(...args)
}

/**
 * Interface function for getting the stats data of an attack and defense
 * @param {{ 
 *  customAttack: object, 
 *  customDefense: object, 
 *  unitAttack: object, 
 *  requiredAccuracy: number
 * }} data The attack and defense data
 * @returns {{ 
 *  averages: number[], 
 *  histograms: {value: *, amount: number, percentage: number, atLeastPercentage: number }[][], 
 *  totalNum: number 
 * }} All the stats data
 */
export const getStatsResults = ({ customAttack: attack, customDefense: defense, unitAttack, requiredAccuracy }) => {
    let allResults = getAttackObject(unitAttack, attack, defense, requiredAccuracy).calcresults(defense.dice);
    return {
        averages: getAverage(allResults),
        histograms: getHistograms(allResults, [ACC, DAM, SUR, BLO, EVA, DOD]),
        totalNum: allResults.length
    }
}

/**
 * Takes data about an attack and computes averages vs 1 black die and vs 1 white die
 * and other data for comparison
 * 
 * @param {{ 
 *  name: string, dice: string[], bonus: number[], 
 *  unitData: { unit: object?, classCards: object[], weapon: object?, mods: object[], focused: boolean } 
 * }} attackData Data about an attack
 * @returns {object} comparison data for the attack
 */
export const getCompareResults = ({ name, unitData, ...customData }) => {
    const attack = getAttackObject(unitData, customData)
    const [blackAvgAcc, blackAvgDam] = attack.calcaverage([BLACK])
    const [whiteAvgAcc, whiteAvgDam] = attack.calcaverage([WHITE])
    return { id: uuid(), name, ...customData, unitData, blackAvgDam, blackAvgAcc, whiteAvgDam, whiteAvgAcc }
}

/**
 * Adds the values of two arrays together to produce a new array
 * @param {number[]} a An array to add
 * @param {number[][]} others Any other arrays to add (of the same length as a)
 * @returns {number[]} An array of the sum of the values of all the arrays
 */
export const addValues = (a = [0, 0, 0, 0, 0, 0], ...others) => {
    return a.map((value, index) => value + others.reduce((total, b) => b ? total + b[index] : total, 0))
}

/**
 * Gets an average from a list of rolls
 * @param {number[][]} results A list of possible results from rolls
 * @returns {number[]} The average of all the results
 */
export const getAverage = (results) => {
    if (results.length === 0) return [0, 0, 0, 0, 0, 0]
    return addValues([0, 0, 0, 0, 0, 0], ...results).map(num => num / results.length)
}

/**
 * Creates multiple histograms for a specified list of properties (or indexes into an array)
 * @param {number[][]|Object[]} data an array of data points (either arrays or objects)
 * @param {number[]|string[]} properties a list of properties or array indexes to make histograms for
 * @returns {{
 *  value: *, 
 *  amount: number, 
 *  percentage: number, 
 *  atLeastPercentage: number }[][]
 * } An array of histograms, in the same order as the properties array
 */
export const getHistograms = (data, properties) => {
    const histograms = properties.map(_ => [])
    // For each datapoint, add the data to the histograms for each property
    data.forEach((dataPoint) => {
        properties.forEach((property, index) => {
            let item = histograms[index].find(i => i.value === dataPoint[property]);
            // If there's not already an item in the histogram for that property value, make one
            if (!item) {
                item = { value: dataPoint[property], amount: 0 }
                histograms[index].push(item)
            }
            // Count this data point in the histogram
            item.amount++
        })
    })
    histograms.forEach(histogram => {
        // Sort the histograms by property value
        histogram.sort((a, b) => a.value - b.value)
        // Calculate percentage of getting the value
        histogram.forEach(item => item.percentage = 100 * item.amount / data.length)
        // Calculate percentage of getting at least the value
        for (let i = histogram.length - 1; i >= 0; i--) {
            histogram[i].atLeastPercentage = (i === histogram.length - 1) ?
                histogram[i].percentage :
                histogram[i].percentage + histogram[i + 1].atLeastPercentage
        }
    })
    return histograms;
}

const removeFromArray = (array, toRemove) => {
    let newArray = [...array]
    toRemove.forEach(item => {
        if (newArray.indexOf(item) !== -1) {
            newArray.splice(newArray.indexOf(item), 1)
        }
    })
    return newArray
}

/**
 * Combines all the unit & class cards & weapon & mods data to make one set of attack data
 * @param {{ 
 *  unit: object?, 
 *  classCards: object[]?, 
 *  weapon: object?, 
 *  mods: object[]?, 
 *  focused: boolean?, 
 *  selectedOptionalIds: string[]?}} unitData The data to combine
 * @returns {{ dice: string[], surgeAbilities: number[][], bonus: [], rerolls: number }} The combined attack data
 */
export const getAttackData = ({ unit, classCards = [], weapon, mods = [], focused = false, hidden = false, selectedOptionalIds = [] }) => {
    const optionals = getAllOptionalAbilities({ unit, classCards, weapon, mods, isAttack: true })
        .filter(a => selectedOptionalIds.includes(a.id));

    return {
        dice: removeFromArray(
            [].concat(
                unit?.attackDice,
                classCards.flatMap(c => c.attackDice),
                weapon?.attackDice,
                mods.flatMap(m => m.attackDice),
                (focused ? GREEN : null),
                optionals.flatMap(a => a.dice)
            ).filter(d => d),
            optionals.flatMap(a => a.negativeAttackDice).filter(d => d)
        ),
        surgeAbilities: [].concat(
            unit?.surgeAbilities,
            classCards.flatMap(c => c.surgeAbilities),
            weapon?.surgeAbilities,
            mods.flatMap(m => m.surgeAbilities),
            optionals.flatMap(a => a.surgeAbilities)
        )
            .filter(a => a),
        bonus: addValues(
            unit?.attackBonus,
            ...classCards.map(c => c.attackBonus),
            weapon?.attackBonus,
            ...mods.map(m => m.attackBonus),
            ...optionals.map(a => a.bonus),
            (hidden ? [0,0,1,0,0,0] : null)
        ),
        rerolls:
            (unit?.attackRerolls || 0) +
            classCards.reduce((total, c) => (c.attackRerolls ? total + c.attackRerolls : total), 0) +
            optionals.reduce((total, a) => (a.rerolls ? total + a.rerolls : total), 0)
    }
}

/**
 * Combines all the unit & class cards to make one set of attack data
 * @param {{ unit: object, classCards: object[], selectedOptionalIds: string[] }} unitData The data to combine
 * @returns {{ dice: string[], bonus: [], rerolls: number }} The combined defense data
 */
export const getDefenseData = ({ unit, hidden = false, classCards = [], selectedOptionalIds = [] }) => {
    const optionals = getAllOptionalAbilities({ unit, classCards })
        .filter(a => selectedOptionalIds.includes(a.id));

    return {
        dice: [].concat(
            unit?.defenseDice,
            classCards.flatMap(c => c.defenseDice),
            optionals.flatMap(a => a.dice)
        ).filter(d => d),
        bonus: addValues(
            unit?.defenseBonus,
            ...classCards.map(c => c.defenseBonus),
            ...optionals.map(a => a.bonus),
            (hidden ? [-2,0,0,0,0,0] : null)
        ),
        rerolls:
            (unit?.defenseRerolls || 0) +
            classCards.reduce((total, c) => (c.defenseRerolls ? total + c.defenseRerolls : total), 0) +
            optionals.reduce((total, a) => (a.rerolls ? total + a.rerolls : total), 0)
    }
}

/**
 * Gets the minimum and maximum possible accuracy for a given attack against a given defense
 * @param {{ dice: string[], surgeAbilities: number[][], bonus: [], rerolls: number }} attack The combined attack data
 * @param {{ dice: string[], bonus: [], rerolls: number }} defense The combined defense data
 * @returns {[number, number]} An array with the min and max accuracy, in that order
 */
export const getMinMaxAccuracy = (attack, defense) => {
    let min = attack.dice.reduce((total, die) => DICE_MIN[die] + total, 0)
        + attack.bonus[ACC]
        + defense.bonus[ACC]
    let max = attack.dice.reduce((total, die) => DICE_MAX[die] + total, 0)
        + attack.bonus[ACC]
        + defense.bonus[ACC]
        + attack.surgeAbilities.reduce((total, ability) => total + ability[ACC], 0)
    return [min < 0 ? 0 : min, max < 0 ? 0 : max]
}
