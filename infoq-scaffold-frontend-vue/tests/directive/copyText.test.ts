import copyText from '@/directive/common/copyText';

describe('directive/copyText', () => {
  it('binds click handler and executes callback', () => {
    const el = document.createElement('button') as any;
    const callback = vi.fn();
    const execSpy = vi.spyOn(document, 'execCommand').mockReturnValue(true as never);

    copyText.beforeMount?.(el, { value: 'hello', arg: undefined } as any);
    copyText.beforeMount?.(el, { value: callback, arg: 'callback' } as any);

    el.click();

    expect(execSpy).toHaveBeenCalledWith('copy');
    expect(callback).toHaveBeenCalledWith('hello');
    el.$destroyCopy();

    execSpy.mockRestore();
  });

  it('handles copy exception gracefully', () => {
    const el = document.createElement('button') as any;
    vi.spyOn(document, 'execCommand').mockImplementation(() => {
      throw new Error('copy failed');
    });
    const errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    copyText.beforeMount?.(el, { value: 'x', arg: undefined } as any);
    el.click();

    expect(errorSpy).toHaveBeenCalled();
    errorSpy.mockRestore();
    vi.restoreAllMocks();
  });

  it('restores selection range after copy', () => {
    const el = document.createElement('button') as any;
    const range = {} as Range;
    const selection = {
      rangeCount: 1,
      getRangeAt: vi.fn(() => range),
      removeAllRanges: vi.fn(),
      addRange: vi.fn()
    };
    const getSelectionSpy = vi.spyOn(document, 'getSelection').mockReturnValue(selection as unknown as Selection);
    const execSpy = vi.spyOn(document, 'execCommand').mockReturnValue(true as never);

    copyText.beforeMount?.(el, { value: 'restore-range', arg: undefined } as any);
    el.click();

    expect(selection.removeAllRanges).toHaveBeenCalledTimes(1);
    expect(selection.addRange).toHaveBeenCalledWith(range);
    getSelectionSpy.mockRestore();
    execSpy.mockRestore();
  });
});
