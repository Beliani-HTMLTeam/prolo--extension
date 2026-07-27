import { ChangeEvent, ReactElement } from "react";

// Type definitions
interface InputProps {
  changeDate: (value: string) => void;
  dateValue: string;
  changeText?: (value: string) => void; // Made optional as it's not used in the component
  textValue: string;
  title: string;
}

export default function Input({ changeDate, dateValue, changeText, textValue, title }: InputProps): ReactElement {
  const handleDateChange = (e: ChangeEvent<HTMLInputElement>): void => {
    const value = e.target.value;
    const isValid = /^\d{4}-\d{2}-\d{2}$/.test(value);
    if (isValid) {
      changeDate(value);
    } else {
      changeDate('');
    }
  };

  return (
    <div className="input">
      <h2 className="input__title">{title}</h2>
      <div className="input__container">
        <input className="input__actOrDeact" type="date" value={dateValue || ''} onChange={handleDateChange} />
        <span className="input__span">|</span>
        <input className="input__actOrDeact" type="text" value={textValue} readOnly />
      </div>
    </div>
  );
}
