import { toast, Toaster } from 'sonner';
import styles from './App.module.scss';
import { fetchCategories } from './utils/fetchFields';
import { languages } from './utils/settings';

const App = () => {
  const handleCopy = async (type: 'alias' | 'name') => {
    try {
      const result = fetchCategories(type);
      await navigator.clipboard.writeText(result);
      toast.success(`Copied ${type === 'alias' ? 'links' : 'titles'} to clipboard!`);
    } catch (err) {
      toast.error('Failed to copy');
      console.error(err);
    }
  };

  const handleSelectAllLanguages = () => {
    const form = document.getElementById('lang_select') as HTMLFormElement | null;
    if (!form) {
      toast.error('Language form not found');
      return;
    }

    const checkboxes = form.querySelectorAll<HTMLInputElement>('input[type="checkbox"][name="lang[]"]');
    checkboxes.forEach((cb) => {
      cb.checked = (languages as readonly string[]).includes(cb.value);
    });

    toast.success('Selected all needed languages!');
  };

  return (
    <>
      <Toaster />
      <div className={styles.app}>
        <button onClick={() => handleCopy('alias')}>Copy Links</button>
        <button onClick={() => handleCopy('name')}>Copy Titles</button>
        <button onClick={handleSelectAllLanguages}>Select All Needed Languages</button>
      </div>
    </>
  );
};

export default App;
