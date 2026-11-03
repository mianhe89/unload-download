import { describe, it, expect, afterEach, vi } from 'vitest';
import { wantsTouch } from '../../src/ui/touch.js';

// matchMedia와 주소창을 흉내 낸다
const setup = ({ fine, coarse, search = '' }) => {
  vi.stubGlobal('location', { search });
  vi.stubGlobal('matchMedia', (q) => ({ matches: (q.includes('any-pointer: fine') && fine) || (q.includes('pointer: coarse') && coarse) }));
};
const game = (touch) => ({ device: { input: { touch } } });

describe('휴대폰 조작을 띄울지', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('마우스·트랙패드가 있는 컴퓨터는 터치를 지원해도 띄우지 않는다', () => {
    setup({ fine: true, coarse: false });
    expect(wantsTouch(game(true))).toBe(false);
  });

  it('손가락이 주된 입력인 휴대폰은 띄운다', () => {
    setup({ fine: false, coarse: true });
    expect(wantsTouch(game(true))).toBe(true);
  });

  it('주소에 ?touch=1 이면 컴퓨터에서도 띄우고, ?touch=0 이면 휴대폰에서도 끈다', () => {
    setup({ fine: true, coarse: false, search: '?touch=1' });
    expect(wantsTouch(game(false))).toBe(true);
    setup({ fine: false, coarse: true, search: '?touch=0' });
    expect(wantsTouch(game(true))).toBe(false);
  });
});
