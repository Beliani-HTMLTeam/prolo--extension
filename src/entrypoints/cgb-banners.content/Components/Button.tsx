import '../styles/style.scss';
import { MouseEventHandler, ReactElement } from 'react';
import Loader from './Loader';

interface ButtonProps {
  componentFunction: MouseEventHandler<HTMLButtonElement>;
  loading?: boolean;
  className?: string;
  disabled?: boolean;
  text?: string;
  name?: string;
}

export default function Button(props: ButtonProps): ReactElement {
  return (
    <div>
      <button
        onClick={props.componentFunction}
        className={props.loading ? `loaderClass ${props.className}` : `animated-button ${props.className}`}
        disabled={props.disabled || props.loading}
      >
        {props.loading ? <Loader text={props.text} /> : props.name}
      </button>
    </div>
  );
}
