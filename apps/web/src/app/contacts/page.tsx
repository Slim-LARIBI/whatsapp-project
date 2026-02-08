export default function ContactsPage() {
  return (
    <div className="flex-1 p-6 bg-gray-50 overflow-auto">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-xl font-semibold">Contacts</h1>
        <p className="text-sm text-gray-500 mt-1">
          CRM WhatsApp (tags, consent, LTV, segmentation) — mock mode.
        </p>

        <div className="mt-6 grid grid-cols-3 gap-4">
          <div className="rounded-2xl bg-white border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase">Total contacts</div>
            <div className="text-2xl font-semibold mt-1">2</div>
          </div>
          <div className="rounded-2xl bg-white border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase">Opted-in</div>
            <div className="text-2xl font-semibold mt-1">1</div>
          </div>
          <div className="rounded-2xl bg-white border border-gray-200 p-4">
            <div className="text-xs text-gray-500 uppercase">Pending</div>
            <div className="text-2xl font-semibold mt-1">1</div>
          </div>
        </div>

        <div className="mt-6 rounded-2xl bg-white border border-gray-200 overflow-hidden">
          <div className="p-4 border-b border-gray-200 flex items-center justify-between">
            <input
              placeholder="Search by name, phone, tag…"
              className="w-full max-w-md px-3 py-2 rounded-xl border border-gray-200 text-sm"
            />
            <div className="flex gap-2">
              <button className="px-3 py-2 text-sm rounded-xl border border-gray-200 hover:bg-gray-50">
                Import CSV
              </button>
              <button className="px-3 py-2 text-sm rounded-xl bg-whatsapp-green text-white hover:bg-whatsapp-dark">
                Add Contact
              </button>
            </div>
          </div>

          <div className="p-4 text-sm text-gray-500">
            Placeholder table — next: list + filters + “Open conversation”.
          </div>
        </div>
      </div>
    </div>
  );
}