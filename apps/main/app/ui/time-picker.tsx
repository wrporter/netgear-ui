import type { InputProps } from '@nextui-org/react';
import { Input } from '@nextui-org/react';
import React, { useState } from 'react';
import DatePicker from 'react-datepicker';

export interface TimePickerProps extends Omit<InputProps, 'defaultValue'> {
    defaultValue?: Date;
}

export function TimePicker({ className, name, defaultValue, ...rest }: TimePickerProps) {
    const [date, setDate] = useState<Date | null>(defaultValue ?? null);

    return (
        <DatePicker
            showTimeSelect
            showTimeSelectOnly
            timeIntervals={15}
            timeCaption="Time"
            dateFormat="h:mm aa"
            selected={date}
            onChange={setDate}
            wrapperClassName={className}
            name={name}
            customInput={<Input {...rest} />}
        />
    );
}
