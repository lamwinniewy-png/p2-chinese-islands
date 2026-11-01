'use strict';
/* 蘇蘇（紅）與晴晴（白）— 立體角色圖片 */
const DOLL = (who, pose, cls = '') => `<img class="doll ${cls}" src="img/${who}-${pose}.webp" alt="${who === 'susu' ? '蘇蘇' : '晴晴'}" draggable="false">`;
const rndWho = () => (Math.random() < .5 ? 'susu' : 'qing');
const MASCOT = {
  get kitty() { return DOLL(rndWho(), 'cheer'); },   // 答對
  get bunny() { return DOLL(rndWho(), 'think'); },   // 提示
  get puppy() { return DOLL(rndWho(), 'happy'); },   // 鼓勵
  get frog() { return DOLL(rndWho(), 'happy'); },
};
const BOW = '<span class="spark" aria-hidden="true">✦</span>';
