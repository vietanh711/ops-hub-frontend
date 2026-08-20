import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'
import { PublicClientApplication } from '@azure/msal-browser'
import { MsalProvider } from '@azure/msal-react'

const msalConfig = {
  auth: {
    clientId: import.meta.env.VITE_AZURE_CLIENT_ID,
    authority: "https://login.microsoftonline.com/common",
    redirectUri: window.location.origin, // Tự động lấy localhost hoặc domain thật sau này
    navigateToLoginRequestUrl: false
  }
};

const msalInstance = new PublicClientApplication(msalConfig);

// BẮT BUỘC: Khởi tạo MSAL và xử lý kết quả Redirect trước khi Render React
msalInstance.initialize().then(() => {
  return msalInstance.handleRedirectPromise();
}).then(() => {
  // Nếu có tài khoản đã đăng nhập, set làm tài khoản mặc định
  const accounts = msalInstance.getAllAccounts();
  if (accounts.length > 0) {
    msalInstance.setActiveAccount(accounts[0]);
  }

  ReactDOM.createRoot(document.getElementById('root')).render(
    <MsalProvider instance={msalInstance}>
      <App />
    </MsalProvider>,
  )
}).catch(err => {
  console.error("Lỗi khởi tạo MSAL:", err);
});