// 가게 규칙(순수): 열린 시간, 오늘 파는 것, 사기·팔기. 가게 데이터는 content/shop/shops.js.
// 세이브 run.shop = { purse: 닢, sold: { '가게.아이템': { day, n } } } — 하루에 파는 수가 정해진 물건은 그날 판 만큼 줄어든다.
// 물건이 들어가는 곳은 가방과 같다: 먹을 것 run.bag, 전투 소모품·재료 run.farm.items, 장비 run.gear (src/life/bag.js의 listBag)
import { SHOPS, PRICES, SELL_RATE, START_PURSE } from '../../content/shop/shops.js';
import { ITEMS } from '../../content/items.js';
import { addItem, takeItem, MAX_STACK } from '../life/bag.js';

export const freshShop = () => ({ purse: START_PURSE, sold: {} });

const toMin = (hhmm) => { const [h, m] = hhmm.split(':').map(Number); return h * 60 + m; };

// 열렸나: 시계가 없는 날(이야기 장면)엔 주인이 서 있으면 연다
export function isOpen(shop, minute = null) {
  if (minute === null || !shop.hours) return true;
  const [a, b] = shop.hours.map(toMin);
  return minute >= a && minute < b;
}

export const priceOf = (id) => PRICES[id] ?? null;
export const sellPriceOf = (id) => (PRICES[id] ? Math.max(1, Math.floor(PRICES[id] * SELL_RATE)) : null);

// 오늘 남은 수 (Infinity = 얼마든지)
export function leftToday(state, shopId, entry, day) {
  if (!entry.n) return Infinity;
  const rec = state?.sold?.[`${shopId}.${entry.item}`];
  return Math.max(0, entry.n - (rec?.day === day ? rec.n : 0));
}

// 오늘 이 가게가 파는 것: [{ item, def, price, left }]. passes(when)는 대본 조건 판정
export function stockOf(shopId, { state, day = 1, passes = () => true } = {}) {
  const shop = SHOPS[shopId];
  if (!shop) return [];
  return shop.stock
    .filter((e) => ITEMS[e.item] && PRICES[e.item] && (!e.when || passes(e.when)))
    .map((e) => ({ item: e.item, def: ITEMS[e.item], price: PRICES[e.item], left: leftToday(state, shopId, e, day) }));
}

// 지금 가진 수 (가방 목록과 같은 자리에서)
export function ownedCount(run, id) {
  const def = ITEMS[id];
  if (!def) return 0;
  if (def.kind === 'gear') return run.gear?.[id] ?? 0;
  if (def.farm) return run.farm?.items?.[id] ?? 0;
  return run.bag?.items?.[id] ?? 0;
}

// 이 가게가 사들이는 내 물건: [{ item, def, price, count }] — 입고 있는 장비는 팔 수 없다
export function sellableOf(shopId, run, equip = {}) {
  const shop = SHOPS[shopId];
  if (!shop?.buys?.length) return [];
  const worn = new Set(Object.values(equip).filter(Boolean));
  const out = [];
  for (const [id, def] of Object.entries(ITEMS)) {
    if (!shop.buys.includes(def.kind) || !PRICES[id]) continue;
    const count = ownedCount(run, id) - (worn.has(id) ? 1 : 0);
    if (count > 0) out.push({ item: id, def, price: sellPriceOf(id), count });
  }
  return out;
}

// 물건을 넣고 빼기: 바뀐 { bag, farm, gear }만 돌려준다
function put(run, id, n) {
  const def = ITEMS[id];
  if (def.kind === 'gear') return { gear: { ...(run.gear ?? {}), [id]: Math.max(0, (run.gear?.[id] ?? 0) + n) } };
  if (def.farm) {
    const farm = run.farm ?? { items: {} };
    return { farm: { ...farm, items: { ...farm.items, [id]: Math.min(99, Math.max(0, (farm.items?.[id] ?? 0) + n)) } } };
  }
  return { bag: n > 0 ? addItem(run.bag, id, n) : takeItem(run.bag, id) };
}

// 사기. 결과 { ok, reason?, changes: { shop, bag?, farm?, gear? } }
//   reason: 'poor'(닢이 모자람) | 'soldout'(오늘 다 팔림) | 'full'(가방 한 칸이 꽉 참) | 'none'
export function buy(run, shopId, id, day = 1, passes = () => true) {
  const entry = stockOf(shopId, { state: run.shop, day, passes }).find((e) => e.item === id);
  if (!entry) return { ok: false, reason: 'none' };
  const state = run.shop ?? freshShop();
  if (entry.left <= 0) return { ok: false, reason: 'soldout' };
  if (state.purse < entry.price) return { ok: false, reason: 'poor' };
  const def = ITEMS[id];
  if (def.kind !== 'gear' && !def.farm && (run.bag?.items?.[id] ?? 0) >= MAX_STACK) return { ok: false, reason: 'full' };
  const key = `${shopId}.${id}`;
  const rec = state.sold?.[key];
  const sold = { ...(state.sold ?? {}), [key]: { day, n: (rec?.day === day ? rec.n : 0) + 1 } };
  return { ok: true, changes: { shop: { ...state, purse: state.purse - entry.price, sold }, ...put(run, id, 1) } };
}

// 팔기 (하나씩)
export function sell(run, shopId, id, equip = {}) {
  const it = sellableOf(shopId, run, equip).find((e) => e.item === id);
  if (!it) return { ok: false, reason: 'none' };
  const state = run.shop ?? freshShop();
  return { ok: true, changes: { shop: { ...state, purse: state.purse + it.price }, ...put(run, id, -1) } };
}

// 주머니에 더하기 (싸움의 대가 등)
export const earn = (state, n) => ({ ...(state ?? freshShop()), purse: Math.max(0, (state?.purse ?? START_PURSE) + n) });
