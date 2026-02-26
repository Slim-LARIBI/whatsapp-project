import { Suspense } from 'react';
import InboxClient from './inbox-client';

export default function InboxPage() {
  return (
    <Suspense fallback={<div className="p-6 text-gray-500">Loading inbox…</div>}>
      <InboxClient />
    </Suspense>
  );
}
