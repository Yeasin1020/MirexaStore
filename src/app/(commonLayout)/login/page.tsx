"use client";

import React, { useState, useEffect } from "react";
import axios from "axios";
import { useRouter, useSearchParams } from "next/navigation";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import { useAppDispatch } from "@/app/lib/redux/hook";
import { loginUser } from "@/app/lib/redux/features/authSlice";
import { DotLottieReact } from "@lottiefiles/dotlottie-react";
import clsx from "clsx";
import { Mail, Lock } from "lucide-react";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);

  const router = useRouter();
  const dispatch = useAppDispatch();
  const searchParams = useSearchParams();

  const redirectPath = decodeURIComponent(searchParams.get("redirect") || "/");

  useEffect(() => {
    const signUpEmail = localStorage.getItem("signUpEmail");
    if (signUpEmail) {
      setEmail(signUpEmail);
      localStorage.removeItem("signUpEmail");
    }

    const token = searchParams.get("token");
    const redirectPathFromGoogle = decodeURIComponent(
      searchParams.get("redirect") || "/"
    );

    const checkGoogleLogin = async () => {
      if (!token) return;

      try {
        const response = await axios.get(
          "https://mirexa-store-backend.vercel.app/api/users/me",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        const user = response.data?.data;

        if (!user || !user.role) {
          toast.error("Login failed: Missing user info.");
          return;
        }

        localStorage.setItem("accessToken", token);
        localStorage.setItem("user", JSON.stringify(user));
        localStorage.setItem("role", user.role);

        dispatch(loginUser({ user, token }));

        toast.success("Google login successful!", {
          position: "top-center",
          autoClose: 1500,
        });

        setTimeout(() => {
          router.push(redirectPathFromGoogle);
        }, 1500);
      } catch (error) {
        console.error("Google login failed:", error);
        toast.error("Google login failed.", {
          position: "top-center",
        });
      }
    };

    checkGoogleLogin();
  }, [searchParams, dispatch, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const response = await axios.post(
        "https://mirexa-store-backend.vercel.app/api/auth/login",
        { email, password }
      );

      const { token, data } = response.data;

      localStorage.setItem("accessToken", token);
      localStorage.setItem("user", JSON.stringify(data));
      localStorage.setItem("role", data.role);

      dispatch(loginUser({ user: data, token }));

      toast.success("Login successful! Redirecting...", {
        position: "top-center",
        autoClose: 2000,
      });

      setTimeout(() => {
        router.push(redirectPath);
      }, 2000);
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.response?.data?.message || "Invalid credentials.", {
        position: "top-center",
        autoClose: 3000,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleLogin = () => {
    setIsGoogleLoading(true);
    const currentPath = window.location.pathname + window.location.search;

    window.open(
      `https://mirexa-store-backend.vercel.app/api/auth/google?redirect=${encodeURIComponent(
        currentPath
      )}`,
      "_self"
    );
  };

  return (
    <div className="max-w-md mx-auto p-8 bg-white rounded-lg shadow-lg">
      <h1 className="text-4xl font-bold mb-8 text-center text-orange-600">
        Welcome Back!
      </h1>

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label className="block text-gray-700 font-medium mb-2">Email</label>
          <div className="relative">
            <Mail className="absolute top-1/2 left-3 transform -translate-y-1/2 text-orange-500 w-5 h-5" />
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 transition duration-200"
              placeholder="Enter your email"
            />
          </div>
        </div>
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Password
          </label>
          <div className="relative">
            <Lock className="absolute top-1/2 left-3 transform -translate-y-1/2 text-orange-500 w-5 h-5" />
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500 transition duration-200"
              placeholder="Enter your password"
            />
          </div>
        </div>
        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full p-4 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition duration-300 disabled:opacity-50"
        >
          {isSubmitting ? "Logging in..." : "Login"}
        </button>
      </form>

      <div className="mt-6 text-center">
        <button
          onClick={handleGoogleLogin}
          disabled={isGoogleLoading}
          className={clsx(
            "w-full bg-blue-600 text-white rounded-lg flex items-center justify-center gap-3 hover:bg-blue-700 transition duration-300 disabled:opacity-50",
            isGoogleLoading ? "py-4 px-4" : "p-0"
          )}
        >
          {isGoogleLoading ? (
            "Redirecting..."
          ) : (
            <>
              <div className="w-14 h-14">
                <DotLottieReact
                  src="https://lottie.host/2813fd69-6326-4035-a1ee-bac91495e432/CCR4vrA6n4.lottie"
                  autoplay
                  loop
                  style={{ width: "100%", height: "100%" }}
                />
              </div>
              <span className="text-base font-medium">Login with Google</span>
            </>
          )}
        </button>
      </div>

      <div className="mt-4 text-center">
        <a href="/register" className="text-sm text-blue-600 hover:underline">
          Don&apos;t have an account? Sign Up
        </a>
      </div>

      <ToastContainer />
    </div>
  );
};

export default Login;
