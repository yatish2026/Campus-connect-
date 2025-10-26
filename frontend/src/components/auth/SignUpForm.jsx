import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../../lib/axios.js";
import { toast } from "react-hot-toast";
import { Loader } from "lucide-react";
import { GoogleLogin } from "@react-oauth/google";
import { useNavigate } from "react-router-dom";

const SignUpForm = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const handleGoogleSuccess = async (credentialResponse) => {
    if (!credentialResponse?.credential) {
      return toast.error("Google signup failed: no credential received");
    }
    try {
      const res = await axiosInstance.post("/auth/google", {
        credential: credentialResponse.credential
      });

      const { token, user } = res.data;

      if (token) {
        localStorage.setItem("token", token);

        // Update the axios instance authorization header
        axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${token}`;

        // Update the auth user in React Query cache
        if (user) {
          queryClient.setQueryData(["authUser"], user);
        } else {
          queryClient.invalidateQueries({ queryKey: ["authUser"] });
        }

        toast.success("Successfully signed in with Google");
        navigate("/home");
      }
    } catch (err) {
      console.error("Google auth error:", err);
      toast.error(err.response?.data?.message || "Failed to sign in with Google");
    }
  };

  const handleGoogleError = () => {
    toast.error("Google sign-in was not successful");
  };

  const handleSignUp = (e) => {
    e.preventDefault();
    signUpMutation({ name, username, email, password });
  };

  const { mutate: signUpMutation, isLoading } = useMutation({
    mutationFn: async (data) => {
      const res = await axiosInstance.post("/auth/signup", data);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Account created successfully");
      queryClient.invalidateQueries({ queryKey: ["authUser"] }); //succes durumunda queryClient sayesinde sayfa yenileme işlemi yapılır ve ekranda manuel olarak yenilemeden gözükür
    },
    onError: (err) => {
      toast.error(err.response.data.message || "Something went wrong");
    },
  });
  return (
    <form onSubmit={handleSignUp} className="flex flex-col gap-4">
      <input
        type="text"
        placeholder="Full name"
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="input input-bordered w-full"
        required
      />
      <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="input input-bordered w-full"
        required
      />
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        className="input input-bordered w-full"
        required
      />
      <input
        type="password"
        placeholder="Password (6+ characters)"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="input input-bordered w-full"
        required
      />

      <button
        type="submit"
        disabled={isLoading}
        className="btn btn-primary w-full text-white"
      >
        {isLoading ? (
          <Loader className="size-5 animate-spin" />
        ) : (
          "Agree & Join"
        )}
      </button>
      <div className="mt-4 flex justify-center">
        <GoogleLogin onSuccess={handleGoogleSuccess} onError={handleGoogleError} />
      </div>
    </form>
  );
};

export default SignUpForm;
