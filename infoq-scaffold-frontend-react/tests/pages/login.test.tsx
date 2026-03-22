import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import type { LoginData } from '@/api/types';
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
  let loginMock = vi.fn<(userInfo: LoginData) => Promise<void>>(async () => undefined);

  beforeEach(() => {
    localStorage.clear();
    loginMock = vi.fn<(userInfo: LoginData) => Promise<void>>(async () => undefined);
    useUserStore.setState({
      login: loginMock
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

    const usernameInput = await screen.findByPlaceholderText('用户名');
    const passwordInput = screen.getByPlaceholderText('密码');
    fireEvent.change(usernameInput, { target: { value: 'admin' } });
    fireEvent.change(passwordInput, { target: { value: '123456' } });
    const codeInput = screen.queryByPlaceholderText('验证码');
    if (codeInput) {
      fireEvent.change(codeInput, { target: { value: '1111' } });
      const uuidInput = document.querySelector('#uuid');
      expect(uuidInput).not.toBeNull();
      fireEvent.change(uuidInput as Element, { target: { value: 'uuid-1' } });
    }

    fireEvent.click(screen.getByRole('button', { name: /登\s*录/ }));

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalled();
      expect(loginMock).toHaveBeenCalledWith(
        expect.objectContaining({
          username: 'admin',
          password: '123456'
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

    const usernameInput = await screen.findByPlaceholderText('用户名');
    const passwordInput = screen.getByPlaceholderText('密码');
    fireEvent.change(usernameInput, { target: { value: 'demo' } });
    fireEvent.change(passwordInput, { target: { value: 'pwd' } });
    const codeInput = screen.queryByPlaceholderText('验证码');
    if (codeInput) {
      fireEvent.change(codeInput, { target: { value: '2222' } });
    }
    fireEvent.click(screen.getByText('记住我'));
    fireEvent.click(screen.getByRole('button', { name: /登\s*录/ }));

    await waitFor(() => {
      expect(localStorage.getItem('username')).toBe('demo');
      expect(localStorage.getItem('rememberMe')).toBe('true');
    });
  });
});
