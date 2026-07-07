import { Team } from '@/hooks/useTeam';
import styles from './SelectTeamView.module.scss';
import logo_light from '@/entrypoints/newtab/img/Beliani_Icon_Brown_RGB.svg';
import logo_dark from '@/entrypoints/newtab/img/Beliani_Icon_Color_RGB.svg';

interface SelectTeamViewProps {
  theme: 'light' | 'dark';
  onSelect: (team: Team) => void;
}

export default function SelectTeamView({ theme, onSelect }: SelectTeamViewProps) {
  return (
    <div className={styles.viewContainer}>
      <img className={styles.logo} src={theme === 'light' ? logo_light : logo_dark} alt="Logo" />
      <h1 className={styles.title}>Select Your Team</h1>
      <div className={styles.buttonContainer}>
        <button className={styles.teamButton} onClick={() => onSelect('HTML')}>
          HTML
        </button>
        <button className={styles.teamButton} onClick={() => onSelect('GRAPHICS')}>
          GRAPHICS
        </button>
      </div>
    </div>
  );
}
