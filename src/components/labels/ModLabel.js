import React from 'react'
import { OverlayTrigger, Popover } from 'react-bootstrap'
import SurgeListLabels from './SurgeListLabels'
import DiceListLabels from './DiceListLabels'
import BonusListLabels from './BonusListLabels'
import TierAndCostLabel from './TierAndCostLabel'

export default function ModLabel({ mod }) {
    const popover = (
        <Popover id={`mod-popover-${mod.id}`} style={{ zIndex: 1200 }}>
            <Popover.Header as="h5" className="fs-5">{mod.name}</Popover.Header>
            <Popover.Body>
                <div style={{ minWidth: "200px" }}>
                    <div className="d-flex">
                        <div className="flex-grow-1 me-2 text-muted">
                            { mod.weaponType} - { mod.modType }
                        </div>
                        { mod.attackDice && (
                            <div className="flex-grow-1 text-end">
                                <DiceListLabels dice={mod.attackDice} />
                            </div>
                        )}
                    </div>
                    <hr />
                    <BonusListLabels bonus={mod.permanentBonus} isAttack />
                    <SurgeListLabels abilities={mod.surgeAbilities} />
                    <div className="my-1"><em>{mod.description}</em></div>
                    <div className="d-flex mt-1">
                        <TierAndCostLabel className="flex-grow-1" tier={mod.tier} cost={mod.cost} />
                    </div>
                </div>
            </Popover.Body>
        </Popover>
    )

    return (
        <OverlayTrigger trigger={["hover", "focus"]} placement="right" overlay={popover}>
            <span className="d-inline-block w-100">{mod.name}</span>
        </OverlayTrigger>
    )
}
