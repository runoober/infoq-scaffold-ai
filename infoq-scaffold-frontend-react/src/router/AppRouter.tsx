import { Suspense, useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import NProgress from 'nprogress';
import 'nprogress/nprogress.css';
import { Spin } from 'antd';
import AuthGuard from '@/router/AuthGuard';
import MainLayout from '@/layouts/MainLayout';
import BackendRouteView from '@/router/BackendRouteView';
import LoginPage from '@/pages/login';
import RegisterPage from '@/pages/register';
import HomePage from '@/pages/index';
import RedirectPage from '@/pages/redirect/index';
import Error401Page from '@/pages/error/401';
import Error404Page from '@/pages/error/404';
import { setNavigator } from '@/utils/router-utils';

NProgress.configure({ showSpinner: false });

function RouterEffects() {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    setNavigator((path: string) => navigate(path));
  }, [navigate]);

  useEffect(() => {
    NProgress.start();
    const frameId = window.requestAnimationFrame(() => {
      NProgress.done();
    });
    return () => {
      window.cancelAnimationFrame(frameId);
      NProgress.done();
    };
  }, [location.key]);

  return null;
}

export default function AppRouter() {
  return (
    <BrowserRouter>
      <RouterEffects />
      <Suspense fallback={<Spin />}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/401" element={<Error401Page />} />
          <Route path="/redirect/*" element={<RedirectPage />} />
          <Route
            path="/"
            element={
              <AuthGuard>
                <MainLayout />
              </AuthGuard>
            }
          >
            <Route index element={<Navigate to="/index" replace />} />
            <Route path="index" element={<HomePage />} />
            <Route path="user/profile" element={<BackendRouteView />} />
            <Route path="*" element={<BackendRouteView />} />
          </Route>
          <Route path="*" element={<Error404Page />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
}
