import { faPlus } from '@fortawesome/free-solid-svg-icons'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import React from 'react'
import { ATTACK_DICE, DEFENSE_DICE } from '../data/dice'
import DieSelector from './DieSelector'

export default function DiceInput({ values, onChange, isDefense }) {

    const addDie = () => {
        onChange([...values, (isDefense) ? BLACK : GREEN])
    }

    const updateDie = (index) => (newColor) => {
        onChange(values.map((curr, i) => (i === index) ? newColor : curr))
    }

    const deleteDie = (index) => {
        onChange(values.filter((_, i) => i !== index))
    }

    return (
        <>
            {values.map((color, index) => (
                <div key={index} className="flex-shrink-0 my-1" style={{ flexBasis: "130px" }}>
                    <DieSelector
                        colors={(isDefense) ? DEFENSE_DICE : ATTACK_DICE}
                        selectedColor={color}
                        onChange={updateDie(index)}
                        onDelete={() => deleteDie(index)}
                    />
                </div>
            ))}
            <button className="btn btn-outline-secondary flex-shrink-0 my-1" onClick={addDie}>
                <FontAwesomeIcon icon={faPlus} size="2x" />
            </button>
        </>
    )
}