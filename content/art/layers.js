// 머리·소품 레이어. '.'는 아래 몸 템플릿을 그대로 둔다.
// 방향별(down/up/side) 16줄. side는 오른쪽을 본다.

const pad = (rows) => [...rows, ...Array(16 - rows.length).fill('................')];

export const LAYERS = {
  short: {
    down: pad(['................', '....oooooooo....', '...ohhhhhhhho...', '..ohhhhhhhhhho..', '..ohhH....Hhho..', '..oh........ho..']),
    up:   pad(['................', '....oooooooo....', '...ohhhhhhhho...', '..ohhhhhhhhhho..', '..ohhhhhhhhhho..', '..ohhhhhhhhhho..', '..oHhhhhhhhhHo..', '...oHHHHHHHHo...']),
    side: pad(['................', '.....oooooo.....', '....ohhhhhho....', '...ohhhhhhhho...', '...ohhhhh.......', '...ohhh.........', '...ohh..........']),
  },
  long: {
    down: pad(['................', '....oooooooo....', '...ohhhhhhhho...', '..ohhhhhhhhhho..', '..ohhH....Hhho..', '..oh........ho..', '..oh........ho..', '..oh........ho..', '..ohh......hho..', '..oho......oho..', '..oho......oho..']),
    up:   pad(['................', '....oooooooo....', '...ohhhhhhhho...', '..ohhhhhhhhhho..', '..ohhhhhhhhhho..', '..ohhhhhhhhhho..', '..ohhhhhhhhhho..', '..ohhhhhhhhhho..', '..ohhhhhhhhhho..', '..oHhhhhhhhhHo..', '...oHHHHHHHHo...']),
    side: pad(['................', '.....oooooo.....', '....ohhhhhho....', '...ohhhhhhhho...', '..ohhhhhh.......', '..ohhhh.........', '..ohhh..........', '..ohhh..........', '..ohhho.........', '..oHHo..........']),
  },
  bob: {
    down: pad(['................', '....oooooooo....', '...ohhhhhhhho...', '..ohhhhhhhhhho..', '..ohH......Hho..', '..oh........ho..', '..oh........ho..', '..oHo......oHo..']),
    up:   pad(['................', '....oooooooo....', '...ohhhhhhhho...', '..ohhhhhhhhhho..', '..ohhhhhhhhhho..', '..ohhhhhhhhhho..', '..ohhhhhhhhhho..', '..oHHHHHHHHHHo..']),
    side: pad(['................', '.....oooooo.....', '....ohhhhhho....', '...ohhhhhhhho...', '...ohhhhhh......', '...ohhhh........', '...ohhh.........', '...oHHo.........']),
  },
  pigtails: {
    down: pad(['................', '................', '................', '................', '.o............o.', 'oho..........oho', 'oho..........oho', 'oHo..........oHo', '.o............o.']),
    up:   pad(['................', '................', '................', '................', '.o............o.', 'oho..........oho', 'oho..........oho', 'oHo..........oHo', '.o............o.']),
    side: pad(['................', '................', '................', '................', '..o.............', '.oho............', '.oho............', '.oHo............', '..o.............']),
  },
  bakerCap: {
    down: pad(['....oooooooo....', '...owwwwwwwwo...', '..owwwwwwwwwwo..', '..oWWWWWWWWWWo..']),
    up:   pad(['....oooooooo....', '...owwwwwwwwo...', '..owwwwwwwwwwo..', '..oWWWWWWWWWWo..']),
    side: pad(['.....oooooo.....', '....owwwwwwo....', '...owwwwwwwwo...', '...oWWWWWWWWo...']),
  },
  mustache: {
    down: pad(['', '', '', '', '', '', '.....ohhhho.....'].map((r) => r || '................')),
    up:   pad([]),
    side: pad(['', '', '', '', '', '', '.........ohho...'].map((r) => r || '................')),
  },
  beard: {
    down: pad(['', '', '', '', '', '', '...ohhhhhhhho...', '...ohhhhhhhho...', '....ohhhhhho....', '.....ohhhho.....'].map((r) => r || '................')),
    up:   pad([]),
    side: pad(['', '', '', '', '', '', '.......ohhhho...', '......ohhhho....', '.......ohho.....'].map((r) => r || '................')),
  },
  helmet: {
    down: pad(['................', '....oooooooo....', '...okkkkkkkko...', '..okkkkkkkkkko..', '..oKKKKKKKKKKo..', '..ok........ko..', '..ok........ko..']),
    up:   pad(['................', '....oooooooo....', '...okkkkkkkko...', '..okkkkkkkkkko..', '..okkkkkkkkkko..', '..okkkkkkkkkko..', '..oKKKKKKKKKKo..', '...oKKKKKKKKo...']),
    side: pad(['................', '.....oooooo.....', '....okkkkkko....', '...okkkkkkkko...', '...oKKKKKKKKo...', '...okk..........', '...okk..........']),
  },
  wizHat: {
    down: pad(['......okko......', '.....okkkko.....', '....okkkkkko....', '.oKKKKKKKKKKKKo.', '..oooooooooooo..']),
    up:   pad(['......okko......', '.....okkkko.....', '....okkkkkko....', '.oKKKKKKKKKKKKo.', '..oooooooooooo..']),
    side: pad(['...oko..........', '....okkko.......', '...okkkkkko.....', '.oKKKKKKKKKKKo..', '..ooooooooooo...']),
  },
  featherHat: {
    down: pad(['...........oro..', '....ookkkkkoro..', '...okkkkkkkkko..', '.oKKKKKKKKKKKKo.']),
    up:   pad(['...........oro..', '....ookkkkkoro..', '...okkkkkkkkko..', '.oKKKKKKKKKKKKo.']),
    side: pad(['....oro.........', '....orokkkko....', '...okkkkkkkko...', '..oKKKKKKKKKKo..']),
  },
  bandana: {
    down: pad(['................', '................', '...okkkkkkkko...', '..oggoKKKKoggo..']),
    up:   pad(['................', '................', '...okkkkkkkko...', '..oKKKKKKKKKKo..', '......okko......']),
    side: pad(['................', '................', '....okkkkkko....', '...oKKKKKKggo...']),
  },
  flowerCrown: {
    down: pad(['................', '................', '...oflflflflo...']),
    up:   pad(['................', '................', '...oflflflflo...']),
    side: pad(['................', '................', '....oflflflo....']),
  },
  hood: {
    down: pad(['................', '....oooooooo....', '...okkkkkkkko...', '..okkkkkkkkkko..', '..okkKKKKKKkko..', '..okKqKKKKqKko..', '..okKKKKKKKKko..', '...okKKKKKKko...', '...okkkkkkkko...']),
    up:   pad(['................', '....oooooooo....', '...okkkkkkkko...', '..okkkkkkkkkko..', '..okkkkkkkkkko..', '..okkkkkkkkkko..', '..okkkkkkkkkko..', '...okkkkkkkko...', '...okkkkkkkko...']),
    side: pad(['................', '.....oooooo.....', '....okkkkkko....', '...okkkkkkkko...', '...okkkKKKKKo...', '...okkkKKqKKo...', '...okkkKKKKKo...', '....okkKKKKo....', '....okkkkkko....']),
  },
};
