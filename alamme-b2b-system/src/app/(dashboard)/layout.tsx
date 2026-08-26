import { createClient } from '@/lib/supabase/server';
import Sidebar from '@/components/Sidebar';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  return (
    <div className="min-h-screen md:flex">
      <Sidebar userEmail={user?.email || ''} />
      <main className="md:flex-1 p-4 md:p-8 max-w-[1400px]">{children}</main>
    </div>
  );
}
