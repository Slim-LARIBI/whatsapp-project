export default function SettingsPage() {
  return (
    <div className="flex-1 p-6 bg-gray-50 overflow-auto">
      <div className="max-w-5xl mx-auto">
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-gray-500 mt-1">
          WhatsApp config + Integrations (WordPress/Presta) + Team.
        </p>

        <div className="mt-6 grid grid-cols-2 gap-4">
          <div className="rounded-2xl bg-white border border-gray-200 p-4">
            <div className="text-sm font-medium">WhatsApp Account</div>
            <div className="text-xs text-gray-500 mt-1">WABA / Phone number / Webhook</div>
            <div className="mt-4 space-y-2">
              <input className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" placeholder="WABA ID" />
              <input className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" placeholder="Phone Number ID" />
              <input className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" placeholder="Webhook URL" />
            </div>
          </div>

          <div className="rounded-2xl bg-white border border-gray-200 p-4">
            <div className="text-sm font-medium">E-commerce Integrations</div>
            <div className="text-xs text-gray-500 mt-1">WordPress / PrestaShop webhooks</div>
            <div className="mt-4 space-y-2">
              <input className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" placeholder="WordPress webhook" />
              <input className="w-full px-3 py-2 rounded-xl border border-gray-200 text-sm" placeholder="PrestaShop webhook" />
              <button className="w-full px-3 py-2 rounded-xl bg-whatsapp-green text-white hover:bg-whatsapp-dark text-sm">
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}