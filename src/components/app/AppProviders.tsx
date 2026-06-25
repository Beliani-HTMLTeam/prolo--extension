import type { ReactNode } from 'react';
import { CookiesProvider } from 'react-cookie';
import { Toaster } from 'sonner';

type AppProvidersProps = {
  children: ReactNode;
};

const AppProviders = ({ children }: AppProvidersProps) => {
  return (
    <CookiesProvider>
      <Toaster position="top-right" richColors />
      {children}
    </CookiesProvider>
  );
};

export default AppProviders;
