'use client';

import { useAutomationStore } from '@/store/automation-store';

export function AutomationForm() {
  const {
    trigger,
    conditions,
    actions,
    setTrigger,
    addCondition,
    addAction,
    reset,
  } = useAutomationStore();

  return (
    <div className="space-y-6">
      {/* Trigger */}
      <section className="border border-gray-200 rounded-xl p-4 bg-white">
        <h2 className="text-sm font-semibold mb-2">Trigger</h2>
        <select
          value={trigger}
          onChange={(e) => setTrigger(e.target.value as any)}
          className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm"
        >
          <option value="">Select trigger</option>
          <option value="message_received">Message received</option>
          <option value="cart_abandoned">Cart abandoned</option>
          <option value="order_paid">Order paid</option>
        </select>
      </section>

      {/* Conditions */}
      <section className="border border-gray-200 rounded-xl p-4 bg-white">
        <h2 className="text-sm font-semibold mb-2">Conditions</h2>

        <div className="space-y-2">
          {conditions.map((c, i) => (
            <div key={i} className="text-sm text-gray-700">
              • {c.type} {c.value !== undefined && `(${c.value})`}
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            className="text-xs px-3 py-2 border rounded-lg"
            onClick={() => addCondition({ type: 'is_vip' })}
          >
            + Is VIP
          </button>
          <button
            className="text-xs px-3 py-2 border rounded-lg"
            onClick={() => addCondition({ type: 'cart_total_gt', value: 100 })}
          >
            + Cart &gt; 100
          </button>
        </div>
      </section>

      {/* Actions */}
      <section className="border border-gray-200 rounded-xl p-4 bg-white">
        <h2 className="text-sm font-semibold mb-2">Actions</h2>

        <div className="space-y-2">
          {actions.map((a, i) => (
            <div key={i} className="text-sm text-gray-700">
              → {a.type} {a.value && `(${a.value})`}
            </div>
          ))}
        </div>

        <div className="mt-3 flex gap-2">
          <button
            className="text-xs px-3 py-2 border rounded-lg"
            onClick={() => addAction({ type: 'send_template', value: 'Abandoned cart reminder' })}
          >
            + Send template
          </button>
          <button
            className="text-xs px-3 py-2 border rounded-lg"
            onClick={() => addAction({ type: 'wait', value: '1h' })}
          >
            + Wait 1h
          </button>
        </div>
      </section>

      {/* Dry run */}
      <section className="border border-dashed border-gray-300 rounded-xl p-4 bg-gray-50">
        <h2 className="text-sm font-semibold mb-2">Dry run (simulation)</h2>
        <pre className="text-xs bg-white p-3 rounded-lg overflow-auto">
{JSON.stringify({ trigger, conditions, actions }, null, 2)}
        </pre>
      </section>

      <div className="flex justify-end gap-2">
        <button
          className="text-sm px-4 py-2 border rounded-lg"
          onClick={reset}
        >
          Reset
        </button>
        <button
          className="text-sm px-4 py-2 bg-whatsapp-green text-white rounded-lg"
          onClick={() => alert('Mock: automation saved')}
        >
          Save automation
        </button>
      </div>
    </div>
  );
}