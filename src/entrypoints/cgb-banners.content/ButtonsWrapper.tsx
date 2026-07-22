import { JSX, useState } from 'react';
import { langSlugDesktop } from './assets';
import { getModal } from './assets';
import Swal from 'sweetalert2';
import emptyUpdate from './img/empty_update.gif';
import Button from './Components/Button';

import './styles/style.scss';

interface ButtonsWrapperProps {
  openModal: () => void; // Adjust based on actual function signature
  offertInput: HTMLInputElement[];
  stateSlug: Record<string, string>;
  useDeactivation: boolean;
}

// Define context type (adjust based on actual structure)
interface LangSlugContext {
  [key: string]: string;
}

// Define loading state type
type LoadingState = 'fulfill' | 'update' | null;


export default function ButtonsWrapper({ 
  openModal, 
  offertInput, 
  stateSlug, 
  useDeactivation 
}: ButtonsWrapperProps): JSX.Element {
 const [loading, setLoading] = useState<LoadingState>(null);
  const [isUpdateDisabled, setIsUpdateDisabled] = useState<boolean>(false);

const checkDates = () => {
  const actDateInput = document.querySelector('input[name="activate_from_date"]#activate_from_date') as HTMLInputElement | null;
  const deactDateInput = document.querySelector('input[name="deactivate_from_date"]#deactivate_from_date') as HTMLInputElement | null;
  const actTimeInput = document.querySelector('input[name="activate_from_time"]#activate_from_time') as HTMLInputElement | null;
  const deactTimeInput = document.querySelector('input[name="deactivate_from_time"]#deactivate_from_time') as HTMLInputElement | null;

  const actDate = actDateInput?.value?.trim() || actDateInput?.placeholder?.trim() || '';
  const deactDate = deactDateInput?.value?.trim() || deactDateInput?.placeholder?.trim() || '';
  const actTime = actTimeInput?.value?.trim() || '';
  const deactTime = deactTimeInput?.value?.trim() || '';

  console.log('Dynamic check → Act:', actDate, actTime, '| Deact:', deactDate, deactTime);

  let shouldDisable = false;

  if (useDeactivation) {
    const activateEmpty = !actDate;
    const deactivateEmpty = !deactDate;

    if (activateEmpty || deactivateEmpty) {
      shouldDisable = true;
    } else if (actDate && deactDate) {
      // Compare dates
      if (actDate > deactDate) {
        shouldDisable = true;
      } 
      // Same date → check time order
      else if (actDate === deactDate && actTime && deactTime) {
        if (actTime >= deactTime) {
          shouldDisable = true;
        }
      }
    }
  }

  setIsUpdateDisabled(shouldDisable);
};

  // Dynamic checking
  useEffect(() => {
    checkDates();

    // MutationObserver (for React-controlled changes)
    const observer = new MutationObserver(checkDates);
    const config = { attributes: true, childList: true, subtree: true };

    const inputs = document.querySelectorAll('input[name*="from_date"], input[name*="from_time"]') ;
    inputs.forEach(input => observer.observe(input, config));

    // Direct event listeners (more responsive for user typing)
    const handleInputChange = () => checkDates();
    
    inputs.forEach(input => {
      input.addEventListener('input', handleInputChange);
      input.addEventListener('change', handleInputChange);
    });

    return () => {
      observer.disconnect();
      inputs.forEach(input => {
        input.removeEventListener('input', handleInputChange);
        input.removeEventListener('change', handleInputChange);
      });
    };
  }, [useDeactivation]);

  const fulfillFunc = () => {
    setLoading('fulfill');
    if (Object.keys(stateSlug).length === 0) {
      getModal('cryMen', 'Please provide context!');
      setLoading(null);
      return;
    }

    offertInput.forEach(input => {
      setInputValue(input, langSlugDesktop);
    });
  };

  const setInputValue =  (input: HTMLInputElement, context: LangSlugContext): void => {
    const name = input.name;
    try {
      if (name in context && context[name] in stateSlug) {
        input.value = stateSlug[context[name]];
        setTimeout(() => {
          input.dispatchEvent(new Event('input', { bubbles: true }));
          input.dispatchEvent(new Event('change', { bubbles: true }));
           setLoading(null);
        }, 5000);
      }
    } catch (e) {
      console.log(e);
      setLoading(null);
    }
  };

  const areDateFieldsEmpty = () => {
    const activateDateInput = document.querySelectorAll('input[name="activate_from_date"]#activate_from_date')[0]  as HTMLInputElement | undefined;
    const deactivateDateInput = document.querySelectorAll('input[name="deactivate_from_date"]#deactivate_from_date')[0]  as HTMLInputElement | undefined;

    const activateIsEmpty = !activateDateInput?.value?.trim();
    const deactivateIsEmpty = !deactivateDateInput?.value?.trim();

    console.log('activate date is empty:', activateIsEmpty);
    console.log('deactivate date is empty:', deactivateIsEmpty);

    return activateIsEmpty || deactivateIsEmpty;
  };

  const handleUpdateClick = async () => {
    setLoading('update');

    if (areDateFieldsEmpty() && useDeactivation) {
      const result = await Swal.fire({
        title: 'Warning',
        html: `
          <div style="text-align: left; font-size: 16px; line-height: 1.15;">
            One or both date popup fields (<strong>Activate time</strong> and/or <strong>Deactivate time</strong>) are empty.<br><br>
            <strong>If you continue:</strong><br>
            • Activation date will be <strong>today 01:00:00</strong><br>
            • Deactivation date will be <strong>today 23:59:00</strong><br><br>
            Continue anyway?
          </div>
          <img src=${emptyUpdate} alt="success" style="width:400px; margin-top: 10px;" />
        `,
        showCancelButton: true,
        confirmButtonColor: '#d33',
        cancelButtonColor: '#3085d6',
        confirmButtonText: 'Yes, continue',
        cancelButtonText: 'Cancel / go back',
        reverseButtons: true,
        allowOutsideClick: false,
      });

      if (!result.isConfirmed) {
        setLoading(null);
        return;
      }
    }

    realUpdate();
  };

  const realUpdate = () => {
    setLoading('update');
 const fuckingUpdate = document.querySelector('input[type="submit"][name="update"]') as HTMLInputElement | null;
 
    if (!fuckingUpdate) return false;

    setTimeout(() => {
      fuckingUpdate.click();
      setTimeout(() => {
        setLoading(null);
      }, 2000);
    }, 500);
  };

  return (
    <div className="buttonsBlock__container">
      <Button componentFunction={openModal} name="Add Context" className="addContext" />
      <Button
        componentFunction={fulfillFunc}
        name="Fulfill Change"
        className="fulfill"
        loading={loading === 'fulfill'}
        text={'Fill in the text'}
      />
      <Button
        componentFunction={handleUpdateClick}
        name="Update"
        className="update"
        loading={loading === 'update'}
        text={'Wait'}
        disabled={isUpdateDisabled}
      />
    </div>
  );
}
