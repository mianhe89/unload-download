// 마을(이야기 필드) 위에서 여는 사이드뷰 전투. 필드를 잠재우고 Battle을 띄웠다가, 끝나면 깨워 결과를 돌려준다.
// 습격(Raids)과 대본의 { act: 'battle' }(견습 시험 등)이 같이 쓴다.
//   fight({ enemies, party, note, winLine, tough, seed }) → Promise<'win' | 'lose'>   ('lose' = 지고 물러났다)
// 전투에서 되돌리면(로드) 누군가 지워진다: 돌아왔을 때 필드에서도 그 사람을 치운다.
import { WorldMemory } from '../../core/world/WorldMemory.js';
import { Sound } from '../../core/audio/Sound.js';
import { PHASE_MUSIC } from '../../../content/audio/audio.js';

export class FieldBattle {
  constructor(field) {
    this.field = field;
    this.pending = null;
    const onWake = (_sys, data) => this.back(data?.battle);
    field.events.on('wake', onWake);
    field.events.once('shutdown', () => field.events.off('wake', onWake));
  }

  get busy() { return Boolean(this.pending); }

  fight({ enemies, party = ['me'], note, winLine, tough = false, seed }) {
    if (this.pending) return Promise.resolve(null);
    const f = this.field;
    f.ui.closeDialog?.();
    f.cameras.main.shake(200, 0.006);
    Sound.sfx(f, 'heavy');
    return new Promise((resolve) => {
      this.pending = resolve;
      f.time.delayedCall(300, () => {
        f.scene.launch('Battle', {
          party: party.filter((id) => id === 'me' || !WorldMemory.isErased(id)),
          enemies, note, winLine, tough,
          seed: (seed ?? (WorldMemory.run.time?.day ?? 1) * 97) + WorldMemory.world.loads,
          from: { field: true, layer: 'surface' },
        });
        f.scene.sleep();
      });
    });
  }

  back(result) {
    const f = this.field;
    for (const [id, npc] of Object.entries(f.npcs ?? {})) {
      if (WorldMemory.isErased(id)) { npc.destroy(); delete f.npcs[id]; }
    }
    Sound.music(f, PHASE_MUSIC[f.phaseId] ?? null, { fade: 400 });
    const r = this.pending;
    this.pending = null;
    r?.(result ?? 'lose');
  }
}
