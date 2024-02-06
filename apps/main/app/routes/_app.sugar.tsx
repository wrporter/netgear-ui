import { Input, Link } from '@nextui-org/react';
import type { MetaFunction } from '@remix-run/node';
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

const inputs: Record<Sweetener, { label: string; description?: string }> = {
    stevia: { label: 'Stevia / Monk Fruit', description: '1 scoop = 1/32 tsp' },
    honey: { label: 'Honey / Maple Syrup' },
    sugar: { label: 'Sugar' },
    powderedSugar: { label: 'Powdered Sugar' },
};

function getNextState(from: Sweetener, value: number, fromUnit: Unit) {
    return sweeteners
        .filter((sweetener) => sweetener !== from)
        .reduce(
            (accu, to) => {
                const { val, unit } = conv(from, to, value, fromUnit);
                accu[to] = { value: val.toString(), unit: unit as Unit };
                return accu;
            },
            { [from]: { value: value.toString(), unit: fromUnit } } as StateType,
        );
}

export const meta: MetaFunction = () => [{ title: 'Sweetener Converter' }];

export default function Page() {
    const [state, setState] = useState<StateType>({
        stevia: { value: '0.5', unit: 'tsp' },
        honey: { value: '1', unit: 'cup' },
        sugar: { value: '2', unit: 'cup' },
        powderedSugar: { value: '3.5', unit: 'cup' },
    });

    function getHandleChange(from: Sweetener) {
        return (event: ChangeEvent<HTMLInputElement>) => {
            const value = Number.parseFloat(event.target.value);
            if (Number.isNaN(value)) {
                setState({
                    ...state,
                    [from]: { value: event.target.value, unit: state[from].unit },
                });
                return;
            }

            setState(getNextState(from, value, state[from].unit));
        };
    }

    function getHandleUnitChange(from: Sweetener) {
        return (event: ChangeEvent<HTMLSelectElement>) => {
            const value = Number.parseFloat(state[from].value);
            const fromUnit = event.target.value as Unit;
            setState(getNextState(from, value, fromUnit));
        };
    }

    return (
        <div className="p-4 flex flex-col space-y-4 max-w-96">
            <h1 className="text-xl font-bold">Sweetener Converter</h1>

            <div className="flex flex-col space-y-4">
                {sweeteners.map((sweetener) => (
                    <Input
                        key={sweetener}
                        type="number"
                        min={0}
                        label={inputs[sweetener].label}
                        description={inputs[sweetener].description}
                        value={state[sweetener].value}
                        onChange={getHandleChange(sweetener)}
                        endContent={
                            <UnitMenu
                                value={state[sweetener].unit}
                                onChange={getHandleUnitChange(sweetener)}
                            />
                        }
                    />
                ))}
            </div>

            <h2 className="text-lg font-bold">Notes</h2>
            <p className="mt-8">
                I recommend the NOW brand powder{' '}
                <Link href="https://a.co/d/bPaeMAO" target="_blank" rel="noreferrer">
                    Monk Fruit
                </Link>{' '}
                and{' '}
                <Link href="https://a.co/d/7HNPYzW" target="_blank" rel="noreferrer">
                    Stevia
                </Link>
                . These come without additives and sugar alcohols. NOW has a great{' '}
                <Link
                    href="https://www.nowfoods.com/healthy-living/articles/monk-fruit-sweetener-equivalency"
                    target="_blank"
                    rel="noreferrer"
                >
                    equivalency chart
                </Link>{' '}
                that I&apos;ve used to determine conversions.
            </p>
            <p>
                These sweeteners have a different taste and sweetness profile. I recommend trying
                out half the amount from the conversion before adding the full amount. I encourage
                you to experiment and find out what you like best.
            </p>
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

function conv(from: Sweetener, to: Sweetener, amount: number, unit: Unit) {
    return convert(amount * (tspRatio[to] / tspRatio[from]))
        .from(unit)
        .toBest({ exclude, cutOffNumber: 0.24 });
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
