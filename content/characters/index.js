// 등장인물 목록. 새 캐릭터는 파일을 추가하고 여기에 등록한다.
import me from './me.js';
import mia from './mia.js';
import selena from './selena.js';
import lu from './lu.js';
import eda from './eda.js';
import hort from './hort.js';
import tom from './tom.js';
import rine from './rine.js';
import per from './per.js';
import keeper from './keeper.js';
import leon from './leon.js';
// 습격하는 오크 (content/raids.js)
import orc from './orc.js';
import tork from './tork.js';
// 배경 주민
import chief from './chief.js';
import granny from './granny.js';
import kid from './kid.js';
import farmer from './farmer.js';
import hunter from './hunter.js';
import monk from './monk.js';
import woman from './woman.js';
import oldman from './oldman.js';
// 길 맵의 떠돌이
import spirit from './spirit.js';
import wanderer from './wanderer.js';
import merchant from './merchant.js';
import elf from './elf.js';
import sei from './sei.js';
import elder from './elder.js';
import lostknight from './lostknight.js';
import brenna from './brenna.js';
import gord from './gord.js';
import yuna from './yuna.js';
import marlo from './marlo.js';
import nell from './nell.js';
import brok from './brok.js';
import helga from './helga.js';
import sylwen from './sylwen.js';
import alma from './alma.js';
import tobin from './tobin.js';
import oswin from './oswin.js';
import mara from './mara.js';
import scribe from './scribe.js';
import envoy from './envoy.js';
import noel from './noel.js';

export const characters = { me, mia, selena, lu, eda, hort, tom, rine, per, keeper, leon, chief, granny, kid, farmer, hunter, monk, woman, oldman, spirit, wanderer, merchant, elf, orc, tork, sei, elder, lostknight, brenna, gord, yuna, marlo, nell, brok, helga, sylwen, alma, tobin, oswin, mara, scribe, envoy, noel };

// 로드 시 지워질 수 있는 사람(동점일 때 이 순서)
export const ERASE_ORDER = ['hort', 'tom', 'rine', 'per', 'elder'];
// 히로인은 2부(소집)부터 지워질 수 있다: 이 플래그가 켜진 뒤로. 가장 마음을 준 사람이 먼저다
export const HEROINE_ORDER = ['mia', 'selena', 'lu'];
export const HEROINES_FROM = 'part1.done';
