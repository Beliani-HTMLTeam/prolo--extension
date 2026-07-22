import { createContext, ReactNode, useEffect, useState } from 'react';
import MainButtons from './MainButtons';

type ImageElement = HTMLImageElement | HTMLVideoElement;
type ParentElement = HTMLElement;
type ImageData = (ImageElement | ParentElement)[];

export const URLContext = createContext<string | null>(null);

export default function App(): React.ReactNode {
  const [imageData, setImageData] = useState<ImageData>([]);
  const [bannerURL, setBannerURL] = useState<string | null>(null);
  const [onlyMedia, setOnlyMedia] = useState<ImageElement[]>([]);

  useEffect(() => {
    // Use a more flexible type for the query selector
    let findImage: NodeListOf<Element> = document.querySelectorAll('tr[id^="trcheckrow"] video[name="media"]');
    
    if (findImage.length === 0) {
      findImage = document.querySelectorAll('tr[id^="trcheckrow"] img');
    }

    const parentElement: ParentElement[] = [];
    const hideArea = document.querySelectorAll('textarea[id^="trnewvalue"]');

    // Convert NodeList to array and collect parent elements
    Array.from(hideArea).forEach(item => {
      const parent = item.parentElement?.parentElement;
      if (parent) {
        parentElement.push(parent);
      }
    });

    // Convert NodeList to array and cast to ImageElement[]
    const mediaArray = Array.from(findImage) as ImageElement[];
    const combinedData: ImageData = [...mediaArray, ...parentElement];

    setImageData(combinedData);
    setOnlyMedia(mediaArray);
  }, []);

  useEffect(() => {
    const splittedUrl = window.location.href.split('?')[0];
    setBannerURL(splittedUrl);
  }, []);

   return (
    <URLContext.Provider value={bannerURL}>
      <MainButtons data={imageData} media={onlyMedia} />
    </URLContext.Provider>
  );
}
