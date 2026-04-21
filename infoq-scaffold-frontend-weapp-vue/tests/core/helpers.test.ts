import { describe, expect, it, vi, type Mock } from 'vitest';
import {
  asCaptchaImage,
  flattenTree,
  formatDateTime,
  getDictLabel,
  handleDeptTree,
  handleTree,
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
    (uni.base64ToArrayBuffer as unknown as Mock).mockImplementation((value: string) => new TextEncoder().encode(value).buffer);
    (uni.getFileSystemManager as unknown as Mock).mockReturnValue({
      writeFile: ({ success }: { success?: () => void }) => {
        success?.();
      }
    });

    const result = await asCaptchaImage('YWJjZA==', 'qa/a?1');

    expect(result).toBe('/tmp/captcha-qaa1.gif');
  });

  it('asCaptchaImage should keep data URL and fallback cache key to latest', async () => {
    (uni.base64ToArrayBuffer as unknown as Mock).mockImplementation((value: string) => new TextEncoder().encode(value).buffer);
    (uni.getFileSystemManager as unknown as Mock).mockReturnValue({
      writeFile: ({ success }: { success?: () => void }) => {
        success?.();
      }
    });

    const result = await asCaptchaImage('data:image/gif;base64,YWJj', '***');

    expect(result).toBe('/tmp/captcha-latest.gif');
  });

  it('asCaptchaImage should use latest cache key when cacheKey is undefined', async () => {
    (uni.base64ToArrayBuffer as unknown as Mock).mockImplementation((value: string) => new TextEncoder().encode(value).buffer);
    (uni.getFileSystemManager as unknown as Mock).mockReturnValue({
      writeFile: ({ success }: { success?: () => void }) => {
        success?.();
      }
    });

    const result = await asCaptchaImage('YWJjZA==');

    expect(result).toBe('/tmp/captcha-latest.gif');
  });

  it('asCaptchaImage should fallback to data URL when write file fails', async () => {
    const warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    (uni.getFileSystemManager as unknown as Mock).mockReturnValue({
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
    const runtime = globalThis as { wx?: Record<string, unknown> };
    const originalWx = runtime.wx;
    runtime.wx = {};

    const result = await asCaptchaImage('raw-base64-no-path', 'cache-key');

    expect(result).toBe('data:image/gif;base64,raw-base64-no-path');
    runtime.wx = originalWx;
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
    expect(resolveTableTotal({ rows: [1, 2, 3] as unknown[], total: 9 })).toBe(9);
    expect(resolveTableTotal({ rows: [1, 2, 3] as unknown[] })).toBe(3);
    expect(resolveTableTotal(undefined)).toBe(0);
    expect(flattenTree(undefined)).toEqual([]);
  });

  it('V-HP-01 should build multi-root tree and recursively attach descendants', () => {
    type BasicTreeNode = {
      id: number;
      parentId: number;
      name: string;
      children?: BasicTreeNode[];
    };
    const source = [
      { id: 1, parentId: 0, name: 'root-1' },
      { id: 2, parentId: 1, name: 'child-1-1' },
      { id: 3, parentId: 2, name: 'child-1-1-1' },
      { id: 4, parentId: 0, name: 'root-2' }
    ];

    const tree = handleTree<BasicTreeNode>(source);

    expect(tree.map((item) => item.id)).toEqual([1, 4]);
    expect(tree[0].children?.map((item) => item.id)).toEqual([2]);
    expect(tree[0].children?.[0].children?.map((item) => item.id)).toEqual([3]);
  });

  it('V-HP-02 should support custom id/parentId/children field names', () => {
    type CustomTreeNode = {
      keyId: string;
      parentKey: string;
      title: string;
      nodes?: CustomTreeNode[];
    };
    const source = [
      { keyId: 'A', parentKey: '0', title: 'root-A' },
      { keyId: 'B', parentKey: 'A', title: 'child-B' },
      { keyId: 'C', parentKey: 'B', title: 'child-C' },
      { keyId: 'D', parentKey: '0', title: 'root-D' }
    ];

    const tree = handleTree<CustomTreeNode>(source, 'keyId', 'parentKey', 'nodes');

    expect(tree.map((item) => item.keyId)).toEqual(['A', 'D']);
    expect(tree[0].nodes?.map((item) => item.keyId)).toEqual(['B']);
    expect(tree[0].nodes?.[0].nodes?.map((item) => item.keyId)).toEqual(['C']);
  });

  it('should fallback to default tree field names when custom args are empty strings', () => {
    type SimpleTreeNode = {
      id: number;
      parentId: number;
      label: string;
      children?: SimpleTreeNode[];
    };
    const source = [
      { id: 1, parentId: 0, label: 'root' },
      { id: 2, parentId: 1, label: 'child' }
    ];

    const tree = handleTree<SimpleTreeNode>(source, '', '', '');

    expect(tree.map((item) => item.id)).toEqual([1]);
    expect(tree[0].children?.map((item) => item.id)).toEqual([2]);
  });

  it('should normalize null parentId values when building tree keys', () => {
    type NullableParentTreeNode = {
      id: number;
      parentId: number | null;
      label: string;
      children?: NullableParentTreeNode[];
    };
    const source: NullableParentTreeNode[] = [
      { id: 1, parentId: null, label: 'root' },
      { id: 2, parentId: 1, label: 'child' }
    ];

    const tree = handleTree<NullableParentTreeNode>(source);

    expect(tree.map((item) => item.id)).toEqual([1]);
    expect(tree[0].children?.map((item) => item.id)).toEqual([2]);
  });

  it('V-HP-03 should build dept tree using preset dept field mapping', () => {
    const source = [
      { deptId: 10, parentId: 0, deptName: '总部' },
      { deptId: 11, parentId: 10, deptName: '研发部' },
      { deptId: 12, parentId: 11, deptName: '平台组' }
    ];

    const tree = handleDeptTree(source) as Array<{ deptId: number; children?: Array<{ deptId: number; children?: Array<{ deptId: number }> }> }>;

    expect(tree.map((item) => item.deptId)).toEqual([10]);
    expect(tree[0].children?.map((item) => item.deptId)).toEqual([11]);
    expect(tree[0].children?.[0].children?.map((item) => item.deptId)).toEqual([12]);
  });

  it('V-HP-04 should keep empty input and orphan nodes stable', () => {
    expect(handleTree([])).toEqual([]);

    type OrphanTreeNode = {
      id: number;
      parentId: number;
      name: string;
      children?: OrphanTreeNode[];
    };
    const orphanSource = [
      { id: 100, parentId: 999, name: 'orphan-root' },
      { id: 101, parentId: 100, name: 'orphan-child' }
    ];
    const orphanTree = handleTree<OrphanTreeNode>(orphanSource);

    expect(orphanTree.map((item) => item.id)).toEqual([100]);
    expect(orphanTree[0].children?.map((item) => item.id)).toEqual([101]);
  });
});
