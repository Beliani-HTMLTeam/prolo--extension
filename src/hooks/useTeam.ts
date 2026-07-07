import { useState, useEffect } from 'react';

export type Team = 'HTML' | 'GRAPHICS' | null;

const useTeam = () => {
  const [team, setTeam] = useState<Team>(null);
  const [isTeamLoaded, setIsTeamLoaded] = useState(false);

  useEffect(() => {
    storage.getItem('local:selectedTeam').then(res => {
      if (res) {
        setTeam(res as Team);
      }
      setIsTeamLoaded(true);
    });

    const unwatch = storage.watch<string>('local:selectedTeam', newValue => {
      setTeam((newValue as Team) || null);
    });

    return () => unwatch();
  }, []);

  const changeTeam = (newTeam: Team) => {
    setTeam(newTeam);
    if (newTeam) {
      storage.setItem('local:selectedTeam', newTeam);
    } else {
      storage.removeItem('local:selectedTeam');
    }
  };

  return { team, changeTeam, isTeamLoaded };
};

export default useTeam;
