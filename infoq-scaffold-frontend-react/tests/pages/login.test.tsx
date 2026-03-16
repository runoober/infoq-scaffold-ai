import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useUserStore } from '@/store/modules/user';

vi.mock('@/api/login', () => ({
  getCodeImg: vi.fn().mockResolvedValue({
    data: {
      captchaEnabled: true,
      uuid: 'uuid-1',
      img: 'abc'
    }
  })
}));

const { default: LoginPage } = await import('@/pages/login');

describe('pages/login', () => {
  beforeEach(() => {
    localStorage.clear();
    useUserStore.setState({
      login: vi.fn().mockResolvedValue(undefined) as unknown as (payload: unknown) => Promise<void>
    });
  });

  it('submits login form', async () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('请输入用户名'), { target: { value: 'admin' } });
    fireEvent.change(screen.getByPlaceholderText('请输入密码'), { target: { value: '123456' } });
    fireEvent.change(screen.getByPlaceholderText('请输入验证码'), { target: { value: '1111' } });
    const uuidInput = document.querySelector('#uuid');
    expect(uuidInput).not.toBeNull();
    fireEvent.change(uuidInput as Element, { target: { value: 'uuid-1' } });

    fireEvent.click(screen.getByRole('button', { name: /登\s*录/ }));

    await waitFor(() => {
      const login = useUserStore.getState().login as unknown as ReturnType<typeof vi.fn>;
      expect(login).toHaveBeenCalled();
      expect(login).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'admin',
          password: '123456',
          code: '1111',
          uuid: 'uuid-1'
        })
      );
    });
  });

  it('keeps remembered account when checkbox checked', async () => {
    render(
      <MemoryRouter>
        <Routes>
          <Route path="*" element={<LoginPage />} />
        </Routes>
      </MemoryRouter>
    );

    fireEvent.change(screen.getByPlaceholderText('请输入用户名'), { target: { value: 'demo' } });
    fireEvent.change(screen.getByPlaceholderText('请输入密码'), { target: { value: 'pwd' } });
    fireEvent.change(screen.getByPlaceholderText('请输入验证码'), { target: { value: '2222' } });
    fireEvent.click(screen.getByText('记住密码'));
    fireEvent.click(screen.getByRole('button', { name: /登\s*录/ }));

    await waitFor(() => {
      expect(localStorage.getItem('username')).toBe('demo');
      expect(localStorage.getItem('rememberMe')).toBe('true');
    });
  });
});
