import { COUNTRY_CASHBACK } from '@/config/shopMaps';

export const uploadBannersToInputs = async (
  tabId: number,
  filesToUpload: Array<{ fileName: string; deviceType: 'desktop' | 'mobile'; variantKey?: string | null }>,
  isCashback = false,
) => {
  console.log(`Uploading ${filesToUpload.length} files to tab ${tabId}, cashback: ${isCashback}`);
  console.log(
    'Files to upload:',
    filesToUpload.map(f => f.fileName),
  );

  return await browser.scripting.executeScript({
    target: { tabId: tabId },
    func: async (filesData, isCashbackMode, countryCashback: Record<string, string>) => {
      console.log('Inside page context, starting upload...');

      // Helper function to get the language from filename using countryCashback
      const getLanguageFromFilename = (fileName: string): string | undefined => {
        const nameWithoutExt = fileName
          .replace(/\.[^/.]+$/, '')
          .trim()
          .trim()
          .toUpperCase();
        const parts = nameWithoutExt.split('_');

        // Get the slug and extra parts
        const slug = parts[0];
        const extra = parts.slice(2).join('-'); // Join extra parts with dash

        // Construct key for lookup
        let key = slug;
        if (extra) {
          key = `${slug}-${extra}`;
        }

        // Look up in countryCashback
        const language = countryCashback[key];
        console.log(`Filename: ${fileName}, key: ${key}, mapped language: ${language}`);

        return language;
      };

      // Helper function to wait for element
      const waitForElement = (selector: string, timeout = 5000): Promise<Element | null> => {
        return new Promise(resolve => {
          const startTime = Date.now();
          const checkElement = () => {
            const element = document.querySelector(selector);
            if (element) {
              resolve(element);
            } else if (Date.now() - startTime > timeout) {
              console.error(`Element ${selector} not found after ${timeout}ms`);
              resolve(null);
            } else {
              setTimeout(checkElement, 200);
            }
          };
          checkElement();
        });
      };

      // Wait for form to be ready
      const form = (await waitForElement('form.banner-form', 10000)) as HTMLFormElement | null;
      if (!form) {
        console.error('Form not found');
        return { success: false, error: 'Form not found' };
      }

      console.log('Form found, waiting for inputs...');
      await new Promise(resolve => setTimeout(resolve, 1000));

      const allDesktopInputs = Array.from(
        form.querySelectorAll('input[type="file"][name^=pic][size="30"]'),
      ) as HTMLInputElement[];

      const allMobileInputs = Array.from(
        form.querySelectorAll('input[type="file"][name^=mobile_pic][size="30"]'),
      ) as HTMLInputElement[];

      console.log(`Found ${allDesktopInputs.length} desktop inputs, ${allMobileInputs.length} mobile inputs`);
      console.log(
        'Desktop input names:',
        Array.from(allDesktopInputs).map(i => i.name),
      );
      console.log(
        'Mobile input names:',
        Array.from(allMobileInputs).map(i => i.name),
      );

      // Function to extract file from background
      const extractFile = async (fileName: string, retries = 3): Promise<File | null> => {
        for (let attempt = 1; attempt <= retries; attempt++) {
          try {
            console.log(`Requesting file: ${fileName} (attempt ${attempt})`);
            const response = await new Promise<any>((resolve, reject) => {
              browser.runtime.sendMessage({ action: 'extractFileFromZip', fileName }, response => {
                if (browser.runtime.lastError) {
                  reject(browser.runtime.lastError);
                } else {
                  resolve(response);
                }
              });
            });

            if (response && response.success && response.fileData) {
              const blob = new Blob([new Uint8Array(response.fileData)], {
                type: 'application/octet-stream',
              });
              const file = new File([blob], fileName, {
                type: blob.type || 'application/octet-stream',
              });
              console.log(`File created: ${fileName}, size: ${file.size} bytes`);
              return file;
            } else {
              console.log(`Attempt ${attempt} failed for ${fileName}:`, response?.error);
              if (attempt === retries) throw new Error(response?.error || 'Failed to extract file');
              await new Promise(resolve => setTimeout(resolve, 1000));
            }
          } catch (error) {
            console.error(`Error extracting ${fileName} (attempt ${attempt}):`, error);
            if (attempt === retries) throw error;
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
        }

        return null;
      };

      const results: Array<{
        fileName: string;
        success: boolean;
        deviceType?: 'desktop' | 'mobile';
        inputName?: string;
        error?: string;
      }> = [];

      // Separate desktop and mobile files
      const desktopFiles = (filesData as Array<{ fileName: string; deviceType: 'desktop' | 'mobile' }>).filter(
        f => f.deviceType === 'desktop',
      );
      const mobileFiles = (filesData as Array<{ fileName: string; deviceType: 'desktop' | 'mobile' }>).filter(
        f => f.deviceType === 'mobile',
      );

      console.log(`Processing ${desktopFiles.length} desktop files and ${mobileFiles.length} mobile files`);

      if (isCashbackMode) {
        // For cashback campaigns

        // Determine which mobile inputs to use (the second half)
        const totalMobileInputs = allMobileInputs.length;
        const halfIndex = Math.floor(totalMobileInputs / 2);
        const modernMobileInputs = Array.from(allMobileInputs).slice(halfIndex);

        console.log(
          `Total mobile inputs: ${totalMobileInputs}, using second half: indices ${halfIndex} to ${totalMobileInputs - 1}`,
        );
        console.log(
          'Modern mobile input names:',
          modernMobileInputs.map(i => i.name),
        );

        // Upload desktop files
        for (let i = 0; i < desktopFiles.length; i++) {
          const fileInfo = desktopFiles[i];
          try {
            console.log(`Processing desktop file ${i + 1}/${desktopFiles.length}: ${fileInfo.fileName}`);

            const file = await extractFile(fileInfo.fileName);
            if (!file) {
              console.error(`Failed to get file for ${fileInfo.fileName}`);
              results.push({ fileName: fileInfo.fileName, success: false, error: 'File extraction returned null' });
              continue;
            }

            // Get the target language using COUNTRY_CASHBACK mapping
            const targetLanguage = getLanguageFromFilename(fileInfo.fileName);
            console.log(`Looking for desktop input with language: ${targetLanguage}`);

            // Find input that matches this language
            let targetInput: HTMLInputElement | null = null;
            for (const input of allDesktopInputs) {
              const inputName = input.getAttribute('name');
              if (!inputName) continue;

              const match = inputName.match(/\[(.*?)\]/);
              if (match && targetLanguage) {
                const inputLang = match[1].toLowerCase();
                if (inputLang === targetLanguage.toLowerCase()) {
                  targetInput = input;
                  console.log(`Found matching desktop input: ${inputName} for language ${targetLanguage}`);
                  break;
                }
              }
            }

            // Fallback to sequential if no match found
            if (!targetInput && i < allDesktopInputs.length) {
              targetInput = allDesktopInputs[i];
              console.log(`No language match, using desktop input ${i}: ${targetInput.name}`);
            }

            if (targetInput) {
              const dataTransfer = new DataTransfer();
              dataTransfer.items.add(file);
              targetInput.files = dataTransfer.files;
              targetInput.dispatchEvent(new Event('change', { bubbles: true }));
              console.log(`✅ Uploaded ${fileInfo.fileName} to ${targetInput.name}`);
              results.push({
                fileName: fileInfo.fileName,
                success: true,
                deviceType: 'desktop',
                inputName: targetInput.name,
              });
              await new Promise(resolve => setTimeout(resolve, 500));
            } else {
              console.error(`No target input found for ${fileInfo.fileName}`);
              results.push({ fileName: fileInfo.fileName, success: false, error: 'No target input found' });
            }
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);

            console.error(`Error uploading ${fileInfo.fileName}:`, error);
            results.push({
              fileName: fileInfo.fileName,
              success: false,
              error: errorMessage,
            });
          }
        }

        // Upload mobile files for cashback - use modernMobileInputs (second half)
        for (let i = 0; i < mobileFiles.length; i++) {
          const fileInfo = mobileFiles[i];
          try {
            console.log(`Processing mobile file ${i + 1}/${mobileFiles.length}: ${fileInfo.fileName}`);

            const file = await extractFile(fileInfo.fileName);
            if (!file) {
              console.error(`Failed to get file for ${fileInfo.fileName}`);
              results.push({ fileName: fileInfo.fileName, success: false, error: 'File extraction returned null' });
              continue;
            }

            // Get the target language using COUNTRY_CASHBACK mapping
            const targetLanguage = getLanguageFromFilename(fileInfo.fileName);
            console.log(`Looking for mobile input with language: ${targetLanguage}`);

            // Find input that matches this language in the modern mobile inputs
            let targetInput: HTMLInputElement | null = null;
            for (const input of modernMobileInputs) {
              const inputName = input.getAttribute('name');
              if (!inputName) continue;

              const match = inputName.match(/\[(.*?)\]/);
              if (match && targetLanguage) {
                const inputLang = match[1].toLowerCase();
                if (inputLang === targetLanguage.toLowerCase()) {
                  targetInput = input;
                  console.log(`Found matching mobile input: ${inputName} for language ${targetLanguage}`);
                  break;
                }
              }
            }

            // Fallback to sequential if no match found
            if (!targetInput && i < modernMobileInputs.length) {
              targetInput = modernMobileInputs[i];
              console.log(`No language match, using mobile input ${i}: ${targetInput.name}`);
            }

            if (targetInput) {
              const dataTransfer = new DataTransfer();
              dataTransfer.items.add(file);
              targetInput.files = dataTransfer.files;
              targetInput.dispatchEvent(new Event('change', { bubbles: true }));
              console.log(`✅ Uploaded ${fileInfo.fileName} to ${targetInput.name}`);
              results.push({
                fileName: fileInfo.fileName,
                success: true,
                deviceType: 'mobile',
                inputName: targetInput.name,
              });
              await new Promise(resolve => setTimeout(resolve, 500));
            } else {
              console.error(`No target input found for ${fileInfo.fileName}`);
              results.push({ fileName: fileInfo.fileName, success: false, error: 'No target input found' });
            }
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error uploading ${fileInfo.fileName}:`, error);
            results.push({ fileName: fileInfo.fileName, success: false, error: errorMessage });
          }
        }
      } else {
        // Regular campaign - use sequential slots
        for (let i = 0; i < desktopFiles.length; i++) {
          const fileInfo = desktopFiles[i];
          try {
            console.log(`Processing desktop file ${i + 1}/${desktopFiles.length}: ${fileInfo.fileName}`);

            const file = await extractFile(fileInfo.fileName);
            if (!file) {
              console.error(`Failed to get file for ${fileInfo.fileName}`);
              results.push({ fileName: fileInfo.fileName, success: false, error: 'File extraction returned null' });
              continue;
            }

            let targetInput = null;
            const currentIndex = results.filter(r => r.deviceType === 'desktop').length;

            if (currentIndex < allDesktopInputs.length) {
              targetInput = allDesktopInputs[currentIndex];
            }

            if (targetInput) {
              const dataTransfer = new DataTransfer();
              dataTransfer.items.add(file);
              targetInput.files = dataTransfer.files;
              targetInput.dispatchEvent(new Event('change', { bubbles: true }));
              console.log(`✅ Successfully uploaded ${fileInfo.fileName} to ${targetInput.name}`);
              results.push({
                fileName: fileInfo.fileName,
                success: true,
                deviceType: 'desktop',
                inputName: targetInput.name,
              });
              await new Promise(resolve => setTimeout(resolve, 500));
            } else {
              console.error(`No target input found for ${fileInfo.fileName}`);
              results.push({ fileName: fileInfo.fileName, success: false, error: 'No target input found' });
            }
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error uploading ${fileInfo.fileName}:`, error);
            results.push({ fileName: fileInfo.fileName, success: false, error: errorMessage });
          }
        }

        // Upload mobile files for regular campaign
        const modernMobileInputs = Array.from(allMobileInputs).slice(17);

        for (let i = 0; i < mobileFiles.length; i++) {
          const fileInfo = mobileFiles[i];
          try {
            console.log(`Processing mobile file ${i + 1}/${mobileFiles.length}: ${fileInfo.fileName}`);

            const file = await extractFile(fileInfo.fileName);
            if (!file) {
              console.error(`Failed to get file for ${fileInfo.fileName}`);
              results.push({ fileName: fileInfo.fileName, success: false, error: 'File extraction returned null' });
              continue;
            }

            let targetInput = null;
            const currentIndex = results.filter(r => r.deviceType === 'mobile').length;

            if (currentIndex < modernMobileInputs.length) {
              targetInput = modernMobileInputs[currentIndex];
            }

            if (targetInput) {
              const dataTransfer = new DataTransfer();
              dataTransfer.items.add(file);
              targetInput.files = dataTransfer.files;
              targetInput.dispatchEvent(new Event('change', { bubbles: true }));
              console.log(`✅ Successfully uploaded ${fileInfo.fileName} to ${targetInput.name}`);
              results.push({
                fileName: fileInfo.fileName,
                success: true,
                deviceType: 'mobile',
                inputName: targetInput.name,
              });
              await new Promise(resolve => setTimeout(resolve, 500));
            } else {
              console.error(`No target input found for ${fileInfo.fileName}`);
              results.push({ fileName: fileInfo.fileName, success: false, error: 'No target input found' });
            }
          } catch (error: unknown) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            console.error(`Error uploading ${fileInfo.fileName}:`, error);
            results.push({ fileName: fileInfo.fileName, success: false, error: errorMessage });
          }
        }
      }
      console.log('Upload complete. Results:', results);
      const totalFiles = Array.isArray(filesData) ? filesData.length : 0;
      const successCount = results.filter((r: any) => r.success).length;

      console.log(`✅ Successfully uploaded ${successCount}/${totalFiles} files`);

      return { success: true, results };
    },
    args: [filesToUpload, isCashback, COUNTRY_CASHBACK],
  });
};
