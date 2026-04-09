import * as Taro from '@tarojs/taro';
import { describe, expect, it, vi } from 'vitest';
import {
  asCaptchaImage,
  flattenTree,
  formatDateTime,
  getDictLabel,
  parseStrEmpty,
  resolveTableTotal,
  stripHtml,
  tansParams,
  toDictOptions
} from '../../src/utils/helpers';

describe('helpers', () => {
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
    expect(formatDateTime(new Date('2026-04-07T08:09:10Z')).startsWith('2026-04-07')).toBe(true);
    expect(formatDateTime(1712477350000).length).toBe(16);
    expect(formatDateTime('invalid-date')).toBe('invalid-date');
    expect(formatDateTime(undefined)).toBe('');
  });

  it('asCaptchaImage should return empty string when image is missing', async () => {
    await expect(asCaptchaImage(undefined)).resolves.toBe('');
  });

  it('asCaptchaImage should materialize to user data path in weapp runtime', async () => {
    (Taro.base64ToArrayBuffer as any).mockImplementation((value: string) => new TextEncoder().encode(value).buffer);
    (Taro.getFileSystemManager as any).mockReturnValue({
      writeFile: ({ success }: { success?: () => void }) => {
        success?.();
      }
    });

    const result = await asCaptchaImage('YWJjZA==', 'qa/a?1');

    expect(result).toBe('/tmp/captcha-qaa1.gif');
  });

  it('asCaptchaImage should keep data URL and fallback cache key to latest', async () => {
    (Taro.base64ToArrayBuffer as any).mockImplementation((value: string) => new TextEncoder().encode(value).buffer);
    (Taro.getFileSystemManager as any).mockReturnValue({
      writeFile: ({ success }: { success?: () => void }) => {
        success?.();
      }
    });

    const result = await asCaptchaImage('data:image/gif;base64,YWJj', '***');

    expect(result).toBe('/tmp/captcha-latest.gif');
  });

  it('asCaptchaImage should use latest cache key when cacheKey is undefined', async () => {
    (Taro.base64ToArrayBuffer as any).mockImplementation((value: string) => new TextEncoder().encode(value).buffer);
    (Taro.getFileSystemManager as any).mockReturnValue({
      writeFile: ({ success }: { success?: () => void }) => {
        success?.();
      }
    });

    const result = await asCaptchaImage('YWJjZA==');

    expect(result).toBe('/tmp/captcha-latest.gif');
  });

  it('asCaptchaImage should fallback to data URL when write file fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    (Taro.getFileSystemManager as any).mockReturnValue({
      writeFile: ({ fail }: { fail?: (error: unknown) => void }) => {
        fail?.(new Error('write-failed'));
      }
    });

    const result = await asCaptchaImage('raw-base64', 'captcha-key');

    expect(result).toBe('data:image/gif;base64,raw-base64');
    expect(warnSpy).toHaveBeenCalledTimes(1);
    warnSpy.mockRestore();
  });

  it('asCaptchaImage should fallback when wx user data path is missing', async () => {
    const originalWx = (globalThis as any).wx;
    (globalThis as any).wx = {};

    const result = await asCaptchaImage('raw-base64-no-path', 'cache-key');

    expect(result).toBe('data:image/gif;base64,raw-base64-no-path');
    (globalThis as any).wx = originalWx;
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
    expect(getDictLabel(options, undefined)).toBe('');
    expect(toDictOptions(undefined)).toEqual([]);
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
    expect(flattenTree(undefined)).toEqual([]);
  });
});
