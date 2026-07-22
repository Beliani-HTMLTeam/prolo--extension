import { ChangeEvent, ReactElement, useEffect, useState } from 'react';
import { checkedDeviceType, filledCashback, getCurrentShop } from '../assets';
import { getModal } from '../assets';
import ChooseZipBtn from './ChooseZipBtn';
import JSZip, { JSZipObject } from 'jszip';

type FileElement = HTMLInputElement;

interface ExtendedFile extends File {
  name: string;
}

export default function LoadZipButton(): ReactElement {
  const [files, setFiles] = useState<ExtendedFile[]>([]);
  const [mobileFiles, setMobileFiles] = useState<FileElement[] | null>(null);
  const [cashbackMobile, setCashbackMobile] = useState<FileElement[] | null>(null);
  const [desktopFiles, setDesktopFiles] = useState<FileElement[] | null>(null);
  const [zipName, setZipName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    const modernMobile: FileElement[] = [];

    const form = document.querySelector<HTMLFormElement>('form.banner-form');
    if (!form) return;

    const input = form.querySelectorAll<FileElement>('input[type="file"][name^=pic][size="30"]');
    const mobile_input = form.querySelectorAll<FileElement>('input[type="file"][name^=mobile_pic][size="30"]');

    const cashbackMobile = Array.from(mobile_input);
    const half = cashbackMobile.length / 2;
    const secondHalf = Array.from(cashbackMobile.slice(half));

    setCashbackMobile(secondHalf);
    setDesktopFiles(Array.from(input));

    mobile_input.forEach((item, index) => {
      if (index > 16) {
        return modernMobile.push(item);
      }
    });
    setMobileFiles(Array.from(modernMobile));
  }, []);

  const handleZipUpload = async (e: ChangeEvent<HTMLInputElement>): Promise<void> => {
    try {
      const zipfile = e.target.files?.[0];
      if (!zipfile) return;

      setZipName(zipfile.name);

      const zip = await JSZip.loadAsync(zipfile);
      const fileInside = Object.values(zip.files).filter((item: JSZipObject) => !item.dir);
      
      // Fix: Use the correct type for JSZipObject
      const extractedFiles: ExtendedFile[] = await Promise.all(
        fileInside.map(async (file: JSZipObject) => {
          const blob = await file.async('blob');
          return new File([blob], file.name, { type: blob.type || 'application/octet-stream' });
        }),
      );

      setFiles(extractedFiles);
    } catch (error) {
      console.error('Error loading ZIP:', error);
      getModal('error', 'Please upload ZIP file!');
      setZipName('');
      setFiles([]);
    }
  };

  useEffect(() => {
    if (files.length === 0) return;

    setLoading(true);

    const processFiles = (): void => {
      try {
          const currentShop = getCurrentShop();
        if (!currentShop) {
          console.warn('No current shop found');
          setLoading(false);
          return;
        }

        const hasCashback = files.some((file: ExtendedFile) => file.name.split('_').length > 2);
        const hasDEAT = files.some((f: ExtendedFile) => f.name.toUpperCase().startsWith('DEAT_'));
        const hasCHDE = files.some((f: ExtendedFile) => f.name.toUpperCase().startsWith('CHDE_'));
        const hasDACH = files.some((f: ExtendedFile) => f.name.toUpperCase().startsWith('DACH_'));

        console.log(`[Priority] Current Shop: ${currentShop} | DEAT:${hasDEAT}, CHDE:${hasCHDE}, DACH:${hasDACH}`);

        for (const item of files) {
          const upperName = item.name.toUpperCase();

          if (hasCashback) {
            if (desktopFiles) {
              filledCashback(item, desktopFiles as unknown as HTMLInputElement[], currentShop);
            }
            if (cashbackMobile) {
              filledCashback(item, cashbackMobile as unknown as HTMLInputElement[], currentShop);
            }
            continue;
          }

          // ==================== PRIORITY LOGIC ====================
          let assigned = false;

          // 1. Highest priority: DEAT for DE/AT
          if (upperName.startsWith('DEAT_') && ['DE', 'AT'].includes(currentShop)) {
            console.log(`→ Assigning DEAT file to ${currentShop}`);
            if (desktopFiles) {
              checkedDeviceType(item, 'desktop', desktopFiles as unknown as HTMLInputElement[]);
            }
            if (mobileFiles) {
              checkedDeviceType(item, 'mobile', mobileFiles as unknown as HTMLInputElement[]);
            }
            assigned = true;
          }

          // 2. Highest priority: CHDE for CH
          else if ((upperName.startsWith('CHDE_') || upperName.startsWith('CH_')) && currentShop === 'CH') {
            console.log(`→ Assigning CHDE/CH file to CH`);
            if (desktopFiles) {
              checkedDeviceType(item, 'desktop', desktopFiles as unknown as HTMLInputElement[]);
            }
            if (mobileFiles) {
              checkedDeviceType(item, 'mobile', mobileFiles as unknown as HTMLInputElement[]);
            }
            assigned = true;
          }

          // 3. DACH as fallback
          else if (upperName.startsWith('DACH_')) {
            const shouldUseDACH =
              (currentShop === 'CH' && !hasCHDE) ||
              (currentShop === 'DE' && !hasDEAT) ||
              (currentShop === 'AT' && !hasDEAT);

            if (shouldUseDACH) {
              console.log(`→ Using DACH as fallback for ${currentShop}`);
               if (desktopFiles) {
                checkedDeviceType(item, 'desktop', desktopFiles as unknown as HTMLInputElement[]);
              }
              if (mobileFiles) {
                checkedDeviceType(item, 'mobile', mobileFiles as unknown as HTMLInputElement[]);
              }
              assigned = true;
            }
          }

          // 4. Normal shops
          else if (!assigned) {
            console.log(`→ Normal assignment for ${upperName}`);
             if (desktopFiles) {
              checkedDeviceType(item, 'desktop', desktopFiles as unknown as HTMLInputElement[]);
            }
            if (mobileFiles) {
              checkedDeviceType(item, 'mobile', mobileFiles as unknown as HTMLInputElement[]);
            }
          }
        }

        getModal('nyan', `Files added! ${hasCashback ? 'Cashback' : 'Regular'}`);
      } catch (e) {
        console.error(e);
        getModal('cryMen', 'Error assigning files');
      } finally {
        setLoading(false);
      }
    };

    const timer = setTimeout(processFiles, 1000);
    return () => clearTimeout(timer);
  }, [files, desktopFiles, mobileFiles, cashbackMobile]);

  return (
    <div className="zip__wrapper">
      <ChooseZipBtn handleZipUpload={handleZipUpload} zipName={zipName} loading={loading} />
    </div>
  );
}
