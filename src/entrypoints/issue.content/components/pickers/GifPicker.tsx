import { useState, useEffect } from 'react';
import { GifPicker as GifPickerKlipy, type GifImage } from 'gif-picker-react-klipy';
import styles from './Picker.module.scss';

const STORAGE_KEY = 'prolo_klipy_api_key';
const saveKey = (key: string) => storage.setItem(`local:${STORAGE_KEY}`, key.trim());

type GifPickerProps = {
  onSelect: (gifUrl: string) => void;
  onClose: () => void;
};

const ApiKeySetup = ({ onSave }: { onSave: (key: string) => void }) => {
  const [input, setInput] = useState('');

  return (
    <div className={styles.apiKeySetup}>
      <p className={styles.apiKeyTitle}>API Key required</p>
      <p className={styles.apiKeyDesc}>
        <a href="https://partner.klipy.com/" target="_blank" rel="noopener noreferrer">
          click here - partner.klipy.com
        </a>{' '}
        register, generate api key and paste below
      </p>
      <input
        type="text"
        className={styles.searchInput}
        placeholder="Klipy API key..."
        value={input}
        onChange={e => setInput(e.target.value)}
        autoFocus
      />
      <button className={styles.apiKeySaveBtn} disabled={!input.trim()} onClick={() => onSave(input.trim())}>
        Save
      </button>
    </div>
  );
};

export const GifPicker = ({ onSelect, onClose }: GifPickerProps) => {
  const [apiKey, setApiKey] = useState<string>('');
  const [showKeyEdit, setShowKeyEdit] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    storage.getItem(`local:${STORAGE_KEY}`).then(res => {
      if (res) setApiKey(res as string);
      setIsLoaded(true);
    });
  }, []);

  const handleSaveKey = (key: string) => {
    saveKey(key);
    setApiKey(key);
    setShowKeyEdit(false);
  };

  const handleGifClick = (gif: GifImage) => {
    onSelect(gif.url);
    onClose();
  };

  if (!isLoaded) {
    return (
      <div className={styles.pickerPanel} style={{ width: 320, padding: 16 }}>
        Loading...
      </div>
    );
  }

  if (!apiKey || showKeyEdit) {
    return (
      <div className={styles.pickerPanel} style={{ width: 320 }}>
        <ApiKeySetup onSave={handleSaveKey} />
      </div>
    );
  }

  return (
    <div>
      <div className={styles.pickerKeyHint}>
        <button className={styles.inlineLink} onClick={() => setShowKeyEdit(true)}>
          Change API Key
        </button>
      </div>
      <GifPickerKlipy klipyApiKey={apiKey} onGifClick={handleGifClick} theme="light" width={350} height={450} />
    </div>
  );
};
