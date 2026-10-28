// 모든 유저가 공유하는 세계(서버 공통 붕괴, 정신체 도움, 도달률 통계)로 가는 창구.
// 지금은 서버가 없으므로 아무것도 보내지 않는다. 오픈베타 단계에서 API를 붙인다.
// 공유 데이터는 다른 유저의 세계를 흔들 수 있으므로 서버에서 1인당 반영량 상한을 검증한다.
export const GlobalWorld = {
  enabled: false,
  endpoint: null,

  reportLoad(/* { victim } */) {
    if (!this.enabled) return;
    // 추후: fetch(`${this.endpoint}/loads`, { method: 'POST', body: ... })
  },

  // 추후: 서버 공통 붕괴 단계. 지금은 오픈일 기준 날짜 계산으로 대신한다.
  collapseStage() { return 0; },
};
