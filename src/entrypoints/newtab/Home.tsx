'use client';

import { useState, useEffect } from 'react';
import useTeam, { Team } from '@/hooks/useTeam';

import '@/assets/styles/reset.css';

import SelectTeamView from '@/entrypoints/newtab/views/SelectTeamView';
import HtmlDashboard from '@/entrypoints/newtab/views/html/HtmlDashboard';
import GraphicsDashboard from '@/entrypoints/newtab/views/graphics/GraphicsDashboard';

export default function Home() {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');
  const { team, changeTeam, isTeamLoaded } = useTeam();

  useEffect(() => {
    storage.getItem('local:theme').then(res => {
      const savedTheme = res as 'light' | 'dark';
      if (savedTheme) {
        setTheme(savedTheme);
      }
    });
  }, []);

  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    storage.setItem('local:theme', theme);
  }, [theme]);

  const handleTeamSelect = (selected: Team) => {
    changeTeam(selected);
  };

  if (!isTeamLoaded) {
    return null;
  }

  if (!team) {
    return <SelectTeamView theme={theme} onSelect={handleTeamSelect} />;
  }

  if (team === 'GRAPHICS') {
    return <GraphicsDashboard />;
  }

  return <HtmlDashboard theme={theme} setTheme={setTheme} />;
}
