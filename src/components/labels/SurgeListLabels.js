import React from 'react'
import { SUR } from '../../data/dice';
import SurgeCostLabel from './SurgeCostLabel';
import ValueListLabels from './ValueListLabels';

export default function SurgeListLabels({ abilities }) {
  return (
    <>
      {abilities.map((ability, index) => (
        <React.Fragment key={index}>
          <div>
            <SurgeCostLabel num={Math.abs(ability[SUR])} className="me-2" />
            <ValueListLabels values={ ability.map((value, i) => i === SUR ? 0 : value) } isAttack />
          </div>
          <hr />
        </React.Fragment>
      ))}
    </>
  )
}