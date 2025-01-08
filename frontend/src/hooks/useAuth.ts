import { useAuth as useOidcAuth } from "react-oidc-context";
import { config } from '../config';

export function useCustomAuth() {
  const auth = useOidcAuth();

  const signOut = () => {
    const clientId = config.cognitoClientId;
    const logoutUri = config.logoutUri;
    const cognitoDomain = config.cognitoDomain;
    window.location.href = `${cognitoDomain}/logout?client_id=${clientId}&logout_uri=${encodeURIComponent(logoutUri)}`;
  };

  const signIn = () => {
    auth.signinRedirect({ extraQueryParams: { lang: 'ja' } });
  };

  const resetAuth = () => {
    localStorage.clear();
    window.location.href = '/';
  };

  return {
    ...auth,
    signOut,
    signIn,
    resetAuth,
  };
}
