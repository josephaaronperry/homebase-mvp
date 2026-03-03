import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Profile',
  description:
    'Manage your HomeBase profile. Update your name, phone, and account settings.',
  openGraph: {
    title: 'Profile | HomeBase',
    description: 'Manage your profile and account settings.',
  },
};

export default function ProfileLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
