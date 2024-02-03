import { Input } from '@nextui-org/react';
import type { Unit } from 'convert-units';
import convert from 'convert-units';
import type { ChangeEvent, ChangeEventHandler } from 'react';
import React, { useState } from 'react';

type Sweetener = 'stevia' | 'honey' | 'sugar' | 'powderedSugar';
const sweeteners: Sweetener[] = ['stevia', 'honey', 'sugar', 'powderedSugar'];

const tspRatio: Record<Sweetener, number> = {
    stevia: 1, // 1 tsp
    honey: 96, // 1 cup
    sugar: 192, // 2 cups
    powderedSugar: 336, // 3.5 cups
};

type StateType = Record<Sweetener, { value: string; unit: Unit }>;

export default function Page() {
    const [state, setState] = useState<StateType>({
        stevia: { value: '0.5', unit: 'tsp' },
        honey: { value: '1', unit: 'cup' },
        sugar: { value: '2', unit: 'cup' },
        powderedSugar: { value: '3.5', unit: 'cup' },
    });

    function getHandleChange2(sweetener: Sweetener) {
        return (event: ChangeEvent<HTMLInputElement>) => {
            const value = Number.parseFloat(event.target.value);
            if (!value) {
                setState({
                    ...state,
                    [sweetener]: { value: event.target.value, unit: state[sweetener].unit },
                });
                return;
            }

            const nextState = sweeteners.reduce((accu, to) => {
                const other = conv(sweetener, to, value, state[sweetener].unit);
                // @ts-ignore
                accu[other] = { value: other.val, unit: other.unit };
                return accu;
            }, {} as StateType);

            setState(nextState);
        };
    }

    function getHandleUnitChange(sweetener: Sweetener) {
        return (event: ChangeEvent<HTMLSelectElement>) => {
            setState({ ...state, [sweetener]: { ...state[sweetener], unit: event.target.value } });
        };
    }

    return (
        <div className="p-4 flex flex-col space-y-4">
            <h1>Sweetener Converter</h1>
            <div>1/2 tsp (16 scoops) stevia = 1/2 cup honey = 1 cup sugar</div>

            <div className="flex flex-col space-y-4">
                <Input
                    label="Stevia / Monk Fruit"
                    size="sm"
                    description="1 scoop = 1/16 tsp"
                    value={state.stevia.value}
                    onChange={getHandleChange2('stevia')}
                    endContent={
                        <UnitMenu
                            value={state.stevia.unit}
                            onChange={getHandleUnitChange('stevia')}
                        />
                    }
                />

                <Input
                    label="Honey / Maple Syrup"
                    size="sm"
                    value={state.honey.value}
                    onChange={getHandleChange2('honey')}
                    endContent={
                        <UnitMenu
                            value={state.honey.unit}
                            onChange={getHandleUnitChange('honey')}
                        />
                    }
                />

                <Input
                    label="Sugar"
                    size="sm"
                    value={state.sugar.value}
                    onChange={getHandleChange2('sugar')}
                    endContent={
                        <UnitMenu
                            value={state.sugar.unit}
                            onChange={getHandleUnitChange('sugar')}
                        />
                    }
                />

                <Input
                    label="Powdered Sugar"
                    size="sm"
                    value={state.sugar.value}
                    onChange={getHandleChange2('powderedSugar')}
                    endContent={
                        <UnitMenu
                            value={state.powderedSugar.unit}
                            onChange={getHandleUnitChange('powderedSugar')}
                        />
                    }
                />
            </div>
        </div>
    );
}

const exclude: Unit[] = [
    'mm3',
    'cm3',
    'ml',
    'l',
    'kl',
    'm3',
    'km3',
    'in3',
    'fl-oz',
    'pnt',
    'qt',
    'gal',
    'ft3',
    'yd3',
];

const bestOptions = { exclude };

function conv(from: Sweetener, to: Sweetener, amount: number, unit: Unit) {
    return convert(amount * (tspRatio[to] / tspRatio[from]))
        .from(unit)
        .toBest(bestOptions);
}

interface UnitProps {
    value: string;
    onChange: ChangeEventHandler<HTMLSelectElement>;
}

function UnitMenu({ value, onChange }: UnitProps) {
    return (
        <div className="flex items-center">
            <label>
                <span className="sr-only">Unit</span>
                <select
                    className="outline-none border-0 bg-transparent text-small cursor-pointer"
                    value={value}
                    onChange={onChange}
                >
                    <option>tsp</option>
                    <option>Tbs</option>
                    <option>cup</option>
                </select>
            </label>
        </div>
    );
}
