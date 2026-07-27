import { ReactElement, useContext, useEffect, useState } from 'react';
import { URLContext } from './App';
import { bannerDEV, bannerPROD } from './assets/index';
import ButtonsBlock from './ButtonsBlock';

import './styles/style.scss';
import LoadForOne from './Components/LoadForOne';

interface MainButtonsProps {
  data: HTMLElement[];
  media: (HTMLImageElement | HTMLVideoElement)[];
}

interface DataItem extends HTMLElement {
  style: CSSStyleDeclaration;
}

export default function MainButtons({ data, media }: MainButtonsProps): ReactElement  {
  const [isHidden, setIsHidden] = useState<boolean>(false);
  const [isShow, setIsShow] = useState<boolean>(false);

  const [showScroll, setShowScroll] = useState<boolean>(false);

  const bannerURL = useContext(URLContext);

  const hideFunction = (): void => {
    data.forEach((item: DataItem) => {
      item.style.display = `${isHidden ? 'block' : 'none'}`;
    });
    setIsHidden(!isHidden);
  };

  const showPanel = (e: React.MouseEvent<HTMLButtonElement>): void => {
    setIsShow(!isShow);
  };

  useEffect(() => {
    const handleScroll = (): void => {
      window.pageYOffset > 900 ? setShowScroll(true) : setShowScroll(false);
    };

    window.addEventListener('scroll', handleScroll);

    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  });

  const handleScrollToTop = (): void => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <>
      <div className="mainButtons">
        {bannerURL === bannerDEV || bannerURL === bannerPROD ? (
          <>
            <button onClick={hideFunction} className="showImageBtn">
              {isHidden ? 'Show image' : 'Hide image'}
            </button>

            <button onClick={showPanel} className={`openButton ${isShow ? 'hide' : ''}`}>
              <span>Open CGB Button</span>
            </button>

            <ButtonsBlock isShow={isShow} onClose={() => setIsShow(false)} imgData={media} />
          </>
        ) : (
          <LoadForOne />
        )}
      </div>

      <button onClick={handleScrollToTop} style={{ display: showScroll ? 'block' : 'none' }} className="scroll-btn">
        <svg height="1.2em" className="arrow" viewBox="0 0 512 512">
          <path d="M233.4 105.4c12.5-12.5 32.8-12.5 45.3 0l192 192c12.5 12.5 12.5 32.8 0 45.3s-32.8 12.5-45.3 0L256 173.3 86.6 342.6c-12.5 12.5-32.8 12.5-45.3 0s-12.5-32.8 0-45.3l192-192z"></path>
        </svg>
      </button>
    </>
  );
}