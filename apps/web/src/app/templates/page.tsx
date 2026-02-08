'use client';

export default function TemplatesPage() {
  return (
    <div className="flex-1 min-h-0 overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto p-8">
        <div className="bg-white border border-gray-200 rounded-2xl p-6">
          <h1 className="text-xl font-semibold">Templates</h1>
          <p className="text-sm text-gray-500 mt-2">
            ✅ On a déplacé l’UX Templates dans l’Inbox (drawer) pour que ce soit “pro SaaS”.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Prochainement: page dédiée (gestion, catégories, approval, variables, multi-brands).
          </p>
        </div>
      </div>
    </div>
  );
}