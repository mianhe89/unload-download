// 부드러운 번쩍임. 화면 전체를 순백으로 터뜨리는 카메라 flash 대신, 옅은 색이 스쳤다가 천천히 빠진다.
// 눈부심·깜빡임이 없도록 진하기는 낮게(기본 0.28), 한 번만. 화면을 연달아 깜빡이는 효과는 쓰지 않는다.
// color: 0xRRGGBB, alpha: 가장 진할 때(0~1), ms: 빠지는 데 걸리는 시간
export function softFlash(scene, { color = 0xfff4e0, alpha = 0.28, ms = 500 } = {}) {
  const cam = scene.cameras.main;
  const veil = scene.add.rectangle(0, 0, 10, 10, color, alpha).setOrigin(0).setDepth(9500);
  // 카메라가 보는 범위를 매 프레임 덮는다(배율·스크롤과 상관없이)
  const cover = () => { const v = cam.worldView; veil.setPosition(v.x, v.y).setSize(v.width, v.height); };
  cover();
  scene.tweens.add({
    targets: veil, alpha: 0, duration: ms, ease: 'Quad.easeOut',
    onUpdate: cover, onComplete: () => veil.destroy(),
  });
  return new Promise((r) => scene.time.delayedCall(ms, r));
}
