import React, { useState } from 'react'
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome'
import { faPlus } from '@fortawesome/free-solid-svg-icons'
import DieInput from './DieInput'
import DieSelectMenu from './DieSelectMenu'
import { ATTACK_DICE, DEFENSE_DICE } from '../../../../data/dice'

export default function DiceListInput({ values, onChange, isDefense }) {
    const [isAddMenuOpen, setIsAddMenuOpen] = useState(false);

    const addDie = (color) => {
        onChange([...values, color])
        setIsAddMenuOpen(false);
    }

    const deleteDie = (index) => {
        onChange(values.filter((_, i) => i !== index))
    }

    return (
        <>
            {values.map((color, index) => (
                <div key={index} className="flex-shrink-0 my-1" style={{ flexBasis: "90px" }}>
                    <DieInput color={color} onDelete={() => deleteDie(index)} />
                </div>
            ))}
            <div className="p-relative">
                <button className="btn btn-outline-secondary flex-shrink-0" onClick={() => setIsAddMenuOpen(!isAddMenuOpen)}>
                    <FontAwesomeIcon icon={faPlus} size="2x" />
                </button>
                <DieSelectMenu isOpen={isAddMenuOpen} colors={(isDefense) ? DEFENSE_DICE : ATTACK_DICE} onChange={addDie} />
            </div>
        </>
    )
}