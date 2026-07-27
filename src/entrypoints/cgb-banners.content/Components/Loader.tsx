import { ReactElement } from 'react';
import { MagnifyingGlass } from 'react-loader-spinner';

interface LoaderProps {
  text?: string;
}

export default function Loader({ text = '' }: LoaderProps): ReactElement {
  return (
    <div className="loaderWrapper">
      <MagnifyingGlass
        visible={true}
        height="30"
        width="30"
        ariaLabel="magnifying-glass-loading"
        wrapperStyle={{}}
        wrapperClass="magnifying-glass-wrapper"
        glassColor="#c0efff"
        color="#7a5f61ff"
      />
      <p>{text}...</p>
    </div>
  );
}
