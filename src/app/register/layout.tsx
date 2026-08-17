import AuthShell from '@/components/auth/AuthShell';

export default function RegisterLayout({ children }: { children: React.ReactNode }) {
  return <AuthShell>{children}</AuthShell>;
}
