import {
  flattenTree,
  formatDateTime,
  getDictLabel,
  parseStrEmpty,
  resolveTableTotal,
  stripHtml,
  tansParams,
  toDictOptions
} from '../../src/mobile-core/helpers';

describe('mobile-core/helpers', () => {
  it('parseStrEmpty should normalize nullable values', () => {
    expect(parseStrEmpty(undefined)).toBe('');
    expect(parseStrEmpty(null)).toBe('');
    expect(parseStrEmpty('undefined')).toBe('');
    expect(parseStrEmpty('null')).toBe('');
    expect(parseStrEmpty(42)).toBe('42');
  });

  it('tansParams should serialize primitive and nested values', () => {
    const query = tansParams({
      pageNum: 1,
      empty: '',
      filters: {
        status: '0',
        dept: 12,
        ignored: ''
      }
    });

    expect(query).toContain('pageNum=1');
    expect(query).toContain('filters%5Bstatus%5D=0');
    expect(query).toContain('filters%5Bdept%5D=12');
    expect(query).not.toContain('empty=');
    expect(query).not.toContain('ignored=');
  });

  it('stripHtml should remove tags and normalize spaces', () => {
    expect(stripHtml('<p> hello <b>world</b> </p>')).toBe('hello world');
    expect(stripHtml('')).toBe('');
  });

  it('formatDateTime should format valid dates and keep invalid input', () => {
    expect(formatDateTime('2026-04-07 08:09:10')).toBe('2026-04-07 08:09');
    expect(formatDateTime('invalid-date')).toBe('invalid-date');
    expect(formatDateTime(undefined)).toBe('');
  });

  it('toDictOptions and getDictLabel should map labels correctly', () => {
    const options = toDictOptions([
      { dictLabel: '正常', dictValue: '0' },
      { dictLabel: '停用', dictValue: '1' }
    ]);

    expect(options).toEqual([
      { label: '正常', value: '0', cssClass: undefined, listClass: undefined },
      { label: '停用', value: '1', cssClass: undefined, listClass: undefined }
    ]);
    expect(getDictLabel(options, '1')).toBe('停用');
    expect(getDictLabel(options, 'x')).toBe('x');
  });

  it('flattenTree and resolveTableTotal should work for list responses', () => {
    const flat = flattenTree([
      {
        id: 1,
        label: 'A',
        children: [{ id: 2, label: 'B', children: [] }]
      }
    ]);

    expect(flat.map((item) => `${item.id}:${item._depth}`)).toEqual(['1:0', '2:1']);
    expect(resolveTableTotal({ rows: [1, 2, 3] as any[], total: 9 })).toBe(9);
    expect(resolveTableTotal({ rows: [1, 2, 3] as any[] })).toBe(3);
    expect(resolveTableTotal(undefined)).toBe(0);
  });
});
