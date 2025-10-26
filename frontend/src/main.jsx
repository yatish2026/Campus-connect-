import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { BrowserRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { GoogleOAuthProvider } from "@react-oauth/google";
import MessagesPage from './pages/MessagesPage';

const queryClient = new QueryClient();

createRoot(document.getElementById("root")).render(
  <StrictMode>
    {
      /* Allow a fallback client id so the dev flow still works if .env isn't set.
         The Client ID is public information; however prefer setting VITE_GOOGLE_CLIENT_ID
         in your local .env for clarity. */
    }
    <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID || '558815544186-5c7a6ngtepgj3g95vb1l6g40kevadad5.apps.googleusercontent.com'}>
      <BrowserRouter>
        <QueryClientProvider client={queryClient}>
          <App />
        </QueryClientProvider>
      </BrowserRouter>
    </GoogleOAuthProvider>
  </StrictMode>
);
