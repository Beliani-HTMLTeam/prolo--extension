import EmojiPickerReact, { type EmojiClickData, Theme, EmojiStyle } from 'emoji-picker-react';
import styles from './Picker.module.scss';

type EmojiPickerProps = {
  onSelect: (emoji: string) => void;
  onClose: () => void;
};

export const EmojiPicker = ({ onSelect, onClose }: EmojiPickerProps) => {
  const handleEmojiClick = (data: EmojiClickData) => {
    onSelect(data.emoji);
    onClose();
  };

  return (
    <div className={styles.emojiPickerWrapper}>
      <EmojiPickerReact
        onEmojiClick={handleEmojiClick}
        onReactionClick={handleEmojiClick}
        reactionsDefaultOpen
        allowExpandReactions
        theme={Theme.LIGHT}
        emojiStyle={EmojiStyle.TWITTER}
        lazyLoadEmojis
        width={360}
        height={480}
      />
    </div>
  );
};
