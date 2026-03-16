import ProjectTypes, { propTypes } from '@/utils/propTypes';

describe('utils/propTypes', () => {
  it('exposes commonly used vue-types helpers', () => {
    expect(propTypes.string).toBeDefined();
    expect(propTypes.number).toBeDefined();
    expect(propTypes.bool).toBeDefined();
    expect(propTypes.object).toBeDefined();
    expect(propTypes.func).toBeDefined();
    expect(propTypes.integer).toBeDefined();

    const stringWithDefault = (propTypes.string as any).def('fallback');
    expect(stringWithDefault.default).toBe('fallback');
  });

  it('provides style validable type on ProjectTypes', () => {
    const styleType = (ProjectTypes as any).style;
    expect(styleType).toBeTruthy();
    expect(styleType.type).toEqual([String, Object]);
    expect(styleType.default).toBeUndefined();
  });
});
