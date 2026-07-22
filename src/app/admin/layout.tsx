import type { Metadata } from 'next';
import { ThemeProvider } from '@/components/ds';
import AdminShell from './AdminShell';

export const metadata: Metadata = {
  title: 'Not Found',
  robots: {
    index: false,
    follow: false,
    noarchive: true,
  },
};

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AdminShell>{children}</AdminShell>
    </ThemeProvider>
  );
}
