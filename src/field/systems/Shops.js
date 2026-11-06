// 가게 (필드 부품): 가게 주인에게 말을 걸면 가게 창(ui/ShopPanel)이 열린다. 데이터는 content/shop/shops.js, 규칙은 src/shop/shop.js.
// 주인이 이 맵에 서 있을 때만 연다(지워졌거나 집에 들어갔으면 가게도 없다). 시계가 도는 날엔 열린 시간을 본다.
// 그 사람에게 걸린 이야기(퀘스트·이벤트·처음 듣는 대화)가 먼저고, 가게는 그다음이다(FieldScene.talkTo).
import { SHOPS } from '../../../content/shop/shops.js';
import { isOpen } from '../../shop/shop.js';
import { PlayLog } from '../../core/playtest/PlayLog.js';

export class Shops {
  constructor(scene) {
    this.scene = scene;
    const mapId = scene.mapDef?.id ?? 'village';
    // 이 맵의 가게: 주인 id → 가게 id
    this.byKeeper = Object.fromEntries(Object.entries(SHOPS).filter(([, s]) => s.map === mapId).map(([id, s]) => [s.keeper, id]));
  }

  shopOf(npcId) { return this.byKeeper[npcId] ?? null; }

  // 말 걸기 대신 가게를 열었으면 true
  onTalk(npcId) {
    const id = this.shopOf(npcId);
    if (!id) return false;
    const sc = this.scene, shop = SHOPS[id];
    const minute = sc.clock?.running ? sc.clock.minute : null;
    if (!isOpen(shop, minute)) { sc.bubble(npcId, shop.closed); return true; }
    PlayLog.log('shop', { id });
    sc.ui.shop.show(id, { day: sc.clock?.day ?? 1, passes: (when) => sc.world().passes(when) });
    return true;
  }
}
