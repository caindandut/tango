import { describe, expect, it } from 'vitest';
import { getStudyMeaningLines } from '../lib/studyPresentation.js';

describe('study meaning presentation', () => {
  it('places Han-Viet meaning before the Vietnamese meaning without a label', () => {
    const lines = getStudyMeaningLines({
      meaning: 'Nữ giới',
      hanVietMeaning: 'NỮ TÍNH',
      showHanVietMeaning: true,
    });

    expect(lines).toEqual([
      { type: 'hanViet', value: 'NỮ TÍNH' },
      { type: 'meaning', value: 'Nữ giới' },
    ]);
    expect(lines.map((line) => line.value).join(' ')).not.toContain('Hán–Việt:');
  });

  it('omits Han-Viet meaning when the setting is disabled or the value is empty', () => {
    expect(getStudyMeaningLines({
      meaning: 'Nữ giới',
      hanVietMeaning: 'NỮ TÍNH',
      showHanVietMeaning: false,
    })).toEqual([{ type: 'meaning', value: 'Nữ giới' }]);

    expect(getStudyMeaningLines({
      meaning: 'Nữ giới',
      hanVietMeaning: '   ',
      showHanVietMeaning: true,
    })).toEqual([{ type: 'meaning', value: 'Nữ giới' }]);
  });
});
