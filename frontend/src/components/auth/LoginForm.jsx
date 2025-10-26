import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { axiosInstance } from "../../lib/axios";
import toast from "react-hot-toast";
import { Loader } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";

const LoginForm = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const queryClient = useQueryClient();

  const { mutate: loginMutation, isLoading } = useMutation({
    mutationFn: (userData) => axiosInstance.post("/auth/login", userData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
    },
    onError: (err) => {
      toast.error(err.response.data.message || "Something went wrong");
    },
  });

  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      return toast.error("Google login failed: no credential received");
    }
    try {
      const res = await axiosInstance.post("/auth/google", { credential: credentialResponse.credential });
      const { token } = res.data;
      if (token) {
        localStorage.setItem("token", token);
        // Optimistically set authUser so app routes update immediately
        if (res.data.user) {
          queryClient.setQueryData(["authUser"], res.data.user);
        } else {
          queryClient.invalidateQueries({ queryKey: ["authUser"] });
        }
        // Ensure axios will send Authorization header immediately
        try {
          axiosInstance.defaults.headers.Authorization = `Bearer ${token}`;
        } catch (e) {
          // ignore
        }
        toast.success("Logged in with Google");
        navigate("/");
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Google login failed");
    }
  };

  const handleGoogleError = () => {
    toast.error("Google sign-in was not successful");
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    loginMutation({ username, password });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4 w-full max-w-md">
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="input input-bordered w-full"
        required
      />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="input input-bordered w-full"
        required
      />

      <button type="submit" className="btn btn-primary w-full">
        {isLoading ? <Loader className="size-5 animate-spin" /> : "Login"}
      </button>
      <div className="mt-4 flex justify-center">
        <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
      </div>
    </form>
  );
};
export default LoginForm;
