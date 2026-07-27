import { useState, useEffect, ReactElement } from 'react';
import { PulseLoader } from 'react-spinners';

interface ColorPickerProps {
  pickerState: HTMLInputElement[];
  titleText: string;
}

interface InputNamesMap {
  [key: number]: string;
}

export default function ColorPicker({ pickerState, titleText }: ColorPickerProps): ReactElement {
  const [values, setValues] = useState<string[]>([]);

  const inputNames: InputNamesMap = {
    0: 'Countdown text color',
    1: 'Countdown first circle',
    2: 'Countdown second circle',
    3: 'Countdown overlay',
  }

  useEffect(() => {
    const initializeInputs = () => {
      if (pickerState.length === 4) {
        const initial = pickerState.map((el: HTMLInputElement) => el.value || '');
        setValues(initial);
        return true;
      }
      return false;
    };

    if (initializeInputs()) return;

    const attempts = [100, 300, 500, 1000, 2000];
    const timeouts = attempts.map((delay : number) =>
      setTimeout(() => {
        initializeInputs();
      }, delay),
    );
    return () => {
      timeouts.forEach((timeout:  NodeJS.Timeout) => clearTimeout(timeout));
    };
  }, [pickerState]);

  const handleChange = (index: number, newValue: string) => {
    setValues(prev => {
      const copy = [...prev];
      copy[index] = newValue;
      return copy;
    });

    const realInput = pickerState[index];
    if (realInput) {
      realInput.value = newValue;
      realInput.dispatchEvent(new Event('input', { bubbles: true }));
      realInput.dispatchEvent(new Event('change', { bubbles: true }));
    }
  };

  const isValidLength = (value: string): boolean => {
    const hexValue = value.replace('#', '');
    return hexValue.length === 6;
  };

    if (values.length === 0) {
      return <PulseLoader color="#fff" size={10} aria-label="Loading" />;
    }

  return (
    <div className="color-picker">
      <h2 className='color-picker-title'>{titleText}</h2>
      <div className="color-picker-container">
        {values.map((val, i) => (
          <div key={i} className="color-picker-item">
            <p className='color-picker-name'>{inputNames[i]}</p>
            <input
              type="color-picker-input"
              value={val}
              onChange={e => handleChange(i, e.target.value)}
              placeholder={`Color ${i + 1}`}
            />
            {val && !isValidLength(val) && <span className="color-picker-text">Please add 6 numbers</span>}
          </div>
        ))}
      </div>
    </div>
  );
}
