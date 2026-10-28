/* Ad slots. Ads only sit on reading screens (station sheet, Kisah, Pasport): never in the 3D world, HUD,
   intro, tutorial or during a game. Until a publisher ID is set, each slot shows a sized placeholder.

   Going live (owner): put the AdSense publisher ID in `client` and each ad unit's ID in `slots.*.unit`.
   Families are the audience, so requests ask for non-personalised ads; also mark the site as
   child-directed in the AdSense account. */
import { L } from './i18n';

export type AdSlot = 'station' | 'kisah' | 'pasport';
export const ADS = {
  enabled: true,
  client: '',            // e.g. 'ca-pub-0000000000000000'
  nonPersonalised: true,
  slots: {
    station: { on: true, unit: '' }, // under the 3 game cards
    kisah: { on: true, unit: '' },   // end of the Kisah page, after the visit + partner links
    pasport: { on: true, unit: '' }, // bottom of the Pasport page
  } as Record<AdSlot, { on: boolean; unit: string }>,
};

let scriptAdded = false;
function ensureScript() {
  if (scriptAdded || !ADS.client) return; scriptAdded = true;
  const w = window as any; w.adsbygoogle = w.adsbygoogle || [];
  if (ADS.nonPersonalised) w.adsbygoogle.requestNonPersonalizedAds = 1;
  const s = document.createElement('script'); s.async = true; s.crossOrigin = 'anonymous';
  s.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(ADS.client)}`;
  document.head.appendChild(s);
}

/** HTML for one slot, or '' when that slot is off. */
export function adSlot(name: AdSlot): string {
  const s = ADS.slots[name]; if (!ADS.enabled || !s?.on) return '';
  const t = L();
  if (ADS.client && s.unit) {
    return `<aside class="ad" aria-label="${t.ad}" data-ad="${name}"><span class="ad-l">${t.ad}</span><ins class="adsbygoogle" style="display:block" data-ad-client="${ADS.client}" data-ad-slot="${s.unit}" data-ad-format="auto" data-full-width-responsive="true"></ins></aside>`;
  }
  return `<aside class="ad ph" aria-label="${t.ad}" data-ad="${name}"><span class="ad-l">${t.ad}</span><span class="ad-box">300 × 250</span></aside>`;
}
/** Call after a sheet with slots has rendered. */
export function fillAds(root: ParentNode = document) {
  if (!ADS.client) return; ensureScript();
  root.querySelectorAll('ins.adsbygoogle:not([data-adsbygoogle-status])').forEach(() => { try { ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({}); } catch { /* blocked */ } });
}
