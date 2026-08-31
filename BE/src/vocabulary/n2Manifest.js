const N2_UNITS = [
  { unitNumber: 1, titleJa: '名詞A', rangeStart: 1, rangeEnd: 100 },
  { unitNumber: 2, titleJa: '動詞A', rangeStart: 101, rangeEnd: 220 },
  { unitNumber: 3, titleJa: '形容詞A', rangeStart: 221, rangeEnd: 270 },
  { unitNumber: 4, titleJa: '名詞B', rangeStart: 271, rangeEnd: 460 },
  { unitNumber: 5, titleJa: 'カタカナA', rangeStart: 461, rangeEnd: 510 },
  { unitNumber: 6, titleJa: '副詞A＋接続詞', rangeStart: 511, rangeEnd: 580 },
  { unitNumber: 7, titleJa: '名詞C', rangeStart: 581, rangeEnd: 680 },
  { unitNumber: 8, titleJa: '動詞B', rangeStart: 681, rangeEnd: 790 },
  { unitNumber: 9, titleJa: 'カタカナB', rangeStart: 791, rangeEnd: 840 },
  { unitNumber: 10, titleJa: '形容詞B', rangeStart: 841, rangeEnd: 890 },
  { unitNumber: 11, titleJa: '名詞D', rangeStart: 891, rangeEnd: 990 },
  { unitNumber: 12, titleJa: '動詞C', rangeStart: 991, rangeEnd: 1090 },
  { unitNumber: 13, titleJa: '副詞B＋連体詞', rangeStart: 1091, rangeEnd: 1160 },
];

const PART_RANGES = [
  [1, 1, 1, 50],
  [1, 2, 51, 100],
  [2, 1, 101, 160],
  [2, 2, 161, 220],
  [3, 1, 221, 270],
  [4, 1, 271, 320],
  [4, 2, 321, 370],
  [4, 3, 371, 460, 'まとめ1 複合動詞'],
  [5, 1, 461, 510],
  [6, 1, 511, 580],
  [7, 1, 581, 630],
  [7, 2, 631, 655],
  [7, 3, 656, 680, 'まとめ2 同じ漢字を含む名詞'],
  [8, 1, 681, 740],
  [8, 2, 741, 790],
  [9, 1, 791, 840],
  [10, 1, 841, 890],
  [11, 1, 891, 940],
  [11, 2, 941, 990],
  [12, 1, 991, 1040],
  [12, 2, 1041, 1090],
  [13, 1, 1091, 1160],
];

const N2_PARTS = PART_RANGES.map(([unitNumber, partNumber, rangeStart, rangeEnd, summaryTitle]) => ({
  code: `N2-U${String(unitNumber).padStart(2, '0')}-P${String(partNumber).padStart(2, '0')}`,
  unitNumber,
  partNumber,
  title: summaryTitle || `Phần ${partNumber}: ${rangeStart}–${rangeEnd}`,
  rangeStart,
  rangeEnd,
  isSummary: Boolean(summaryTitle),
}));

const TOTAL_N2_WORDS = 1160;

module.exports = {
  N2_PARTS,
  N2_UNITS,
  TOTAL_N2_WORDS,
};
