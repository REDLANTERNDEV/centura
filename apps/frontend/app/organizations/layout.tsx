import { OrganizationProvider } from '@/lib/contexts/OrganizationContext';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Organizations | Centura ERP',
  description: 'Manage your organizations',
};

export default function OrganizationsLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return <OrganizationProvider>{children}</OrganizationProvider>;
}
