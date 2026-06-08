'use client';

export function WhatsAppButton() {
  return (
    <button
      onClick={() => alert('WhatsApp & push notifications are not available in this plan.\nContact support to upgrade.')}
      className="flex-shrink-0 bg-[#25D366] hover:bg-[#1fba59] text-white text-xs font-bold px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
    >
      📲 WhatsApp
    </button>
  );
}
