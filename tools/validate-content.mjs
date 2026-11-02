// 콘텐츠 검증 CLI. 문제가 있으면 종료 코드 1
// 사용: npm run validate
import { validateContent } from './lib/validateContent.mjs';

const { errors, stats } = validateContent();
if (errors.length) {
  console.log(`문제 ${errors.length}개\n- ${errors.join('\n- ')}`);
  process.exit(1);
}
console.log(`OK — 컷신 실행 ${stats.cutsceneRuns}회, 축제를 방치해도 ${stats.idleBellsAt}초에 종이 울림`);
