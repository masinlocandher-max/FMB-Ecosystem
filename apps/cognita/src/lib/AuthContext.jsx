import React, { createContext, useState, useContext, useEffect } from 'react';
import { base44 } from '@/api/base44Client';
import { appParams } from '@/lib/app-params';
import { createAxiosClient } from '@base44/sdk/dist/utils/axios-client';

const AuthContext = createContext();
const PENDING_CONSENT_KEY = 'cognita:pending-consent';

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);
  const [isLoadingPublicSettings, setIsLoadingPublicSettings] = useState(true);
  const [authError, setAuthError] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);
  const [appPublicSettings, setAppPublicSettings] = useState(null);
  const [backendAvailable, setBackendAvailable] = useState(Boolean(appParams.appId));

  useEffect(() => {
    checkAppState();
  }, []);

  const finishPublicMode = (error = null) => {
    setAppPublicSettings({ public_site_available: true, backend_available: false });
    setBackendAvailable(false);
    setIsAuthenticated(false);
    setAuthChecked(true);
    setIsLoadingAuth(false);
    setIsLoadingPublicSettings(false);
    setAuthError(error);
  };

  const persistPendingConsent = async (currentUser) => {
    if (typeof window === 'undefined') return;
    const pending = window.sessionStorage.getItem(PENDING_CONSENT_KEY);
    if (!pending) return;

    try {
      const payload = JSON.parse(pending);
      await base44.entities.ConsentRecord.create({
        ...payload,
        email: payload.email || currentUser?.email || '',
        user_id: currentUser?.id || currentUser?.user_id || '',
      });
      window.sessionStorage.removeItem(PENDING_CONSENT_KEY);
    } catch (error) {
      console.error('Consent record could not be persisted:', error);
    }
  };

  const checkAppState = async () => {
    setIsLoadingPublicSettings(true);
    setAuthError(null);

    // The institutional website must remain available even when the Base44
    // production configuration has not yet been added to GitHub Pages.
    if (!appParams.appId) {
      finishPublicMode({
        type: 'backend_not_configured',
        message: 'The public website is available while applicant services are being configured.',
      });
      return;
    }

    try {
      const publicApiBase = appParams.appBaseUrl
        ? `${appParams.appBaseUrl.replace(/\/$/, '')}/api/apps/public`
        : '/api/apps/public';

      const appClient = createAxiosClient({
        baseURL: publicApiBase,
        headers: { 'X-App-Id': appParams.appId },
        token: appParams.token,
        interceptResponses: true,
      });

      const publicSettings = await appClient.get(`/prod/public-settings/by-id/${appParams.appId}`);
      setAppPublicSettings(publicSettings);
      setBackendAvailable(true);

      if (appParams.token) {
        await checkUserAuth();
      } else {
        setIsLoadingAuth(false);
        setIsAuthenticated(false);
        setAuthChecked(true);
      }
      setIsLoadingPublicSettings(false);
    } catch (appError) {
      console.error('Base44 app-state check failed:', appError);

      // A backend outage or incomplete configuration must not blank the public
      // institutional website. Protected services remain unavailable until the
      // backend is reachable again.
      finishPublicMode({
        type: 'backend_unavailable',
        message: 'Applicant and account services are temporarily unavailable. The public website remains accessible.',
      });
    }
  };

  const checkUserAuth = async () => {
    try {
      setIsLoadingAuth(true);
      const currentUser = await base44.auth.me();
      setUser(currentUser);
      setIsAuthenticated(true);
      setBackendAvailable(true);
      setAuthError(null);
      await persistPendingConsent(currentUser);
      setIsLoadingAuth(false);
      setAuthChecked(true);
    } catch (error) {
      console.error('User auth check failed:', error);
      setIsLoadingAuth(false);
      setIsAuthenticated(false);
      setAuthChecked(true);

      if (error.status === 401 || error.status === 403) {
        setAuthError({ type: 'auth_required', message: 'Authentication required' });
      } else {
        setAuthError({ type: 'backend_unavailable', message: 'Account services are temporarily unavailable.' });
      }
    }
  };

  const logout = (shouldRedirect = true) => {
    setUser(null);
    setIsAuthenticated(false);

    if (shouldRedirect) {
      base44.auth.logout(window.location.href);
    } else {
      base44.auth.logout();
    }
  };

  const navigateToLogin = () => {
    base44.auth.redirectToLogin(window.location.href);
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings,
      authError,
      appPublicSettings,
      authChecked,
      backendAvailable,
      logout,
      navigateToLogin,
      checkUserAuth,
      checkAppState,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
