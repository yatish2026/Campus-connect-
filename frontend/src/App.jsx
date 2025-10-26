import { Navigate, Route, Routes } from "react-router-dom";
import Layout from "./components/layout/Layout";
import HomePage from "./pages/HomePage";
import LandingPage from "./pages/LandingPage";
import SignUpPage from "./pages/auth/SignUpPage";
import LoginPage from "./pages/auth/LoginPage";
import toast, { Toaster } from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "./lib/axios";
import NotificationsPage from "./pages/NotificationsPage";
import NetworkPage from "./pages/NetworkPage";
import PostPage from "./pages/PostPage";
import ProfilePage from "./pages/ProfilePage";
import MessagesPage from "./pages/MessagesPage";
import ClubsPage from "./pages/ClubsPage";
import ClubPage from "./pages/ClubPage";
import InterviewPage from "./pages/InterviewPage";
// Interview Prep removed

function App() {
  const { data: authUser, isLoading } = useQuery({
    queryKey: ["authUser"],
    queryFn: async () => {
      try {
        const res = await axiosInstance.get("/auth/me");
        return res.data;
      } catch (err) {
        if (err.response && err.response.status === 401) {
          return null;
        }
        toast.error(err.response.data.message || "Something went wrong");
      }
    },
  });

  if (isLoading) return null;

  // console.log("AuthUser", authUser);
  return (
    <>
      <Layout>
        <Routes>
          <Route
            path="/"
            element={authUser ? <HomePage /> : <LandingPage />}
          />
          <Route
            path="/signup"
            element={!authUser ? <SignUpPage /> : <Navigate to={"/"} />}
          />
          <Route
            path="/login"
            element={!authUser ? <LoginPage /> : <Navigate to={"/"} />}
          />
          <Route
            path="/notifications"
            element={
              authUser ? <NotificationsPage /> : <Navigate to={"/login"} />
            }
          />
          <Route
            path="/network"
            element={authUser ? <NetworkPage /> : <Navigate to={"/login"} />}
          />
          <Route
            path="/messages"
            element={authUser ? <MessagesPage /> : <Navigate to={'/login'} />}
          />
          <Route path="/clubs" element={authUser ? <ClubsPage /> : <Navigate to={'/login'} />} />
          <Route path="/club/:id" element={authUser ? <ClubPage /> : <Navigate to={'/login'} />} />
          <Route path="/interview" element={authUser ? <InterviewPage /> : <Navigate to={'/login'} />} />
          {/* Interview Prep removed */}
          <Route
            path="/post/:postId"
            element={authUser ? <PostPage /> : <Navigate to={"/login"} />}
          />
          <Route
            path="/profile/:username"
            element={authUser ? <ProfilePage /> : <Navigate to={"/login"} />}
          />
        </Routes>
        <Toaster />
      </Layout>
    </>
  );
}

export default App;
