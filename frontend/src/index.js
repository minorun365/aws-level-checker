import './index.css';
import App from './App';

import React from 'react';
import ReactDOM from 'react-dom/client';
import { AuthProvider } from "react-oidc-context";

const cognitoAuthConfig = {
  authority: process.env.REACT_APP_COGNITO_AUTHORITY,
  client_id: process.env.REACT_APP_COGNITO_CLIENT_ID,
  redirect_uri: process.env.REACT_APP_COGNITO_REDIRECT_URI,
  response_type: "code",
  scope: "email openid phone",
  loadUserInfo: true,
  onSigninCallback: () => {
    window.history.replaceState({}, document.title, window.location.pathname);
  }
};

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <React.StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </React.StrictMode>
);