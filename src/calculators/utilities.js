import { useEffect } from 'react';
import { GREEN } from '../data/dice'

/**
 * A hook for listening to clicks anywhere outside of a DOM node
 * @param {Node} targetRef A reference to the DOM node for listening to clicks outside of
 * @param {function} onClickOutside The event listener for outside clicks
 */
export const useClickOutside = (targetRef, onClickOutside) => {
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (targetRef.current && !targetRef.current.contains(event.target)) onClickOutside()
        }
        document.addEventListener("mousedown", handleClickOutside);

        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [targetRef, onClickOutside]);
}

/***** Data Analysis *****/

/**
 * Adds the values of two arrays together to produce a new array
 * @param {number[]} a An array to add
 * @param {number[][]} others Any other arrays to add (of the same length as a)
 * @returns {number[]} An array of the sum of the values of all the arrays
 */
export const addValues = (a = [0,0,0,0,0,0], ...others) => {
    return a.map((value, index) => value + others.reduce((total, b) => b ? total + b[index] : total, 0))
}


/**
 * Gets an average from a list of rolls
 * @param {number[][]} results A list of possible results from rolls
 * @returns {number[]} The average of all the results
 */
export const getAverage = (results) => {
    if(results.length === 0) return [0, 0, 0, 0, 0, 0]
    return addValues([0, 0, 0, 0, 0, 0], ...results).map(num => num / results.length)
}


/**
 * Creates multiple histograms for a specified list of properties (or indexes into an array)
 * @param {number[][]|Object[]} data an array of data points (either arrays or objects)
 * @param {number[]|string[]} properties a list of properties or array indexes to make histograms for
 * @returns {{value: *, amount: number}[][]} An array of histograms, in the same order as the properties array
 */
export const getHistograms = (data, properties) => {
    const histograms = properties.map(_ => [])
    // For each datapoint, add the data to the histograms for each property
    data.forEach((dataPoint) => {
        properties.forEach((property, index) => {
            let item = histograms[index].find(i => i.value === dataPoint[property]);
            // If there's not already an item in the histogram for that property value, make one
            if(!item) {
                item = { value: dataPoint[property], amount: 0}
                histograms[index].push(item)
            }
            // Count this data point in the histogram
            item.amount++
        })
    })
    histograms.forEach(histogram => {
        // Sort the histograms by property value
        histogram.sort((a,b) => a.value - b.value)
        // Calculate percentage of getting the value
        histogram.forEach(item => item.percentage = 100 * item.amount / data.length)
        // Calculate percentage of getting at least the value
        for(let i = histogram.length - 1; i >= 0; i--) {
            histogram[i].atLeastPercentage = (i === histogram.length - 1) ?
                histogram[i].percentage :
                histogram[i].percentage + histogram[i + 1].atLeastPercentage
        }
    })
    return histograms;
}

/***** Custom Data *****/

export const getEmptyData = (changes) => ({ 
    dice: [], 
    bonus: [0, 0, 0, 0, 0, 0], 
    rerolls: 0, 
    surgeAbilities: [], 
    ...changes 
})

/***** Unit Data *****/

export const getEmptyUnitData = (changes) => ({ 
    unit: null, 
    classCards: [],
    weapon: null,
    mods: [],
    focused: false,
    selectedOptionalIds: [],
    ...changes 
})

/**
 * Combines all the unit & class cards & weapon & mods data to make one set of attack data
 * @param {{ 
 *  unit: object, 
 *  classCards: object[], 
 *  weapon: object, 
 *  mods: object[], 
 *  focused: boolean, 
 *  selectedOptionalIds: string[]}} unitData The data to combine
 * @returns {{ dice: string[], abilities: number[][], bonus: [], rerolls: number }} The combined attack data
 */
export const getAttackData = ({ unit, classCards, weapon, mods, focused, selectedOptionalIds }) => {
    const optionals = getAllOptionalAbilities({ unit, classCards, weapon, mods, isAttack: true })
        .filter(a => selectedOptionalIds.includes(a.id));
    
    return {
        dice: [].concat(
                unit?.attackDice, 
                classCards.flatMap(c => c.attackDice), 
                weapon?.attackDice, 
                mods.flatMap(m => m.attackDice),
                (focused ? GREEN : null),
                optionals.flatMap(a => a.dice)
            )
            .filter(d => d),
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
            ...optionals.map(a => a.bonus)
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
export const getDefenseData = ({ unit, classCards, selectedOptionalIds }) => {
    const optionals = getAllOptionalAbilities({ unit, classCards })
        .filter(a => selectedOptionalIds.includes(a.id));

    return {
        dice: [].concat(
                unit?.defenseDice, 
                classCards.flatMap(c => c.defenseDice),
                optionals.flatMap(a => a.dice)
            )
            .filter(d => d),
        bonus: addValues(
            unit?.defenseBonus, 
            ...classCards.map(c => c.defenseBonus),
            ...optionals.map(a => a.bonus)
        ),
        rerolls: 
            (unit?.defenseRerolls || 0) + 
            classCards.reduce((total, c) => (c.defenseRerolls ? total + c.defenseRerolls : total), 0) +
            optionals.reduce((total, a) => (a.rerolls ? total + a.rerolls : total), 0)
    }
}

export const summarizeUnitData = ({ unit, classCards, weapon, mods, focused }) => {
    let collapsedData = unit?.name || "No unit";
    const allAdditions = (weapon ? [weapon] : []).concat(mods).concat(classCards).map(i => i.name)
    if(focused)
        allAdditions.push("Focused")
    
    if (allAdditions.length > 2)
        collapsedData += " with " + allAdditions.slice(0, -2).join(", ") + ", " + allAdditions.slice(-2).join(" and ")
    else if (allAdditions.length > 0)
        collapsedData += " with " + allAdditions.join(" and ")
    
    return collapsedData;
}


/***** Optional Abilities *****/

export const UNIT = "unit"
export const CLASS_CARD = "classCards"
export const WEAPON = "weapon"
export const MOD = "mods"

const getOptionalAbilities = (entity, property, type) => {
    if(!entity || !entity[property]) return []
    return entity[property].map((ability, index) => ({...ability, id: `${type}-${entity.id}-${index}` }))
}

export const getAllOptionalAbilities = ({ unit, classCards, weapon, mods, isAttack}) => {
    const property = isAttack ? "optionalAttack" : "optionalDefense"
    return [].concat(
        getOptionalAbilities(unit, property, UNIT),
        classCards.flatMap(c => getOptionalAbilities(c, property, CLASS_CARD)),
        getOptionalAbilities(weapon, "optional", WEAPON),
        mods ? mods.flatMap(m => getOptionalAbilities(m, "optional", MOD)) : []
    )
}

export const cleanSelectedOptional = (selected, updatedEntities, type) => {
    let updated = [].concat(updatedEntities)
    return selected.filter(id => !id.startsWith(type) || updated.some(e => id.startsWith(`${type}-${e.id}-`)))
}


/***** Search *****/

export const search = (toCheck, input) => toCheck?.toLowerCase().includes(input.toLowerCase())
export const searchArray = (toCheck, input) => toCheck?.some(item => search(item, input))

export const getNumAtEnd = (str) => parseInt(str.slice(str.search(/\d+$/)))