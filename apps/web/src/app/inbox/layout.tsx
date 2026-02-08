import { Sidebar } from '@/components/shared/sidebar';

export default function InboxLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      {/* min-h-0 IMPORTANT pour que les scroll internes marchent */}
      <main className="flex-1 flex overflow-hidden min-h-0">{children}</main>
    </div>
  );
}