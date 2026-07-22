import { MouseEventHandler, ReactElement } from 'react';
import '../styles/style.scss';

interface CloseButtonProps {
  onClose: MouseEventHandler<HTMLButtonElement>;
}

export default function CloseButton({ onClose }: CloseButtonProps): ReactElement {
  return (
    <div className="close__wrapper">
      <h2 className="buttonsBlock__title">Central Grid Panel</h2>
      <button onClick={onClose} className="buttonsBlock__close">
        <span className="X"></span>
        <span className="Y"></span>
      </button>
    </div>
  );
}
