import React from 'react'
import Select from 'react-select'
import { CLASS_CARDS } from '../../../data/class-cards'
import { IMPERIAL, REBEL } from '../../../data/units'
import ClassCardLabel from '../../labels/ClassCardLabel'
import { search, searchArray, getNumAtEnd } from './selectUtilities'

const CLASS_CARD_OPTIONS = [REBEL, IMPERIAL].map(affiliation => ({
    label: affiliation,
    options: CLASS_CARDS.filter(classCard => classCard.affiliation === affiliation)
}))

const filterOption = (candidate, input) => input.split(" ").every(term =>
    search(candidate.data.name, term)
    || search(candidate.data.affiliation, term)
    || searchArray(candidate.data.availableTo, term)
    || searchArray(candidate.data.attackDice, term)
    || searchArray(candidate.data.defenseDice, term)
    || (search(term, "cost") && candidate.data.cost === getNumAtEnd(term))
    || (search(term, "reroll") && (candidate.data.attackRerolls || candidate.data.defenseRerolls))
)

const noMatchesMessage = <>
    No class cards match your search.<br />
    You can search on: name, affiliation, dice, cost (ex: 'cost2'), 'reroll', and hero names<br />
    Separate search terms with a space.
</>

export default function ClassCardSelect({ value, onChange }) {
    return (
        <Select
            options={CLASS_CARD_OPTIONS}
            className="text-dark w-100"
            filterOption={filterOption}
            getOptionLabel={c => <ClassCardLabel card={c}/>}
            getOptionValue={c => c.id}
            placeholder="Select Class Cards"
            noOptionsMessage={() => noMatchesMessage}
            value={value}
            onChange={onChange}
            isClearable={true}
            isMulti={true}
            styles={{
                menu: provided => ({ ...provided, zIndex: 1100 })
            }}
        />
    )
}
