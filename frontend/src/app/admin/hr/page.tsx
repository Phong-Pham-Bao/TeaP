import { redirect } from 'next/navigation';

export default function LegacyAdminHrPage() {
  redirect('/admin/users');
}
