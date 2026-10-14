import { redirect } from 'next/navigation';

/** Friendly admin entry point. */
export default function AdminEntryPage() {
  redirect('/admin/login');
}
