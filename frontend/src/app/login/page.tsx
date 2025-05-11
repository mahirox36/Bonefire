"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

const Page = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLogin, setIsLogin] = useState(true);
  const [formData, setFormData] = useState({
    username: "",
    password: "",
    email: "",
    display_name: "",
  });
  const router = useRouter();

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      if (isLogin) {
        // Login logic
        const params = new URLSearchParams();
        params.append("username", formData.username);
        params.append("password", formData.password);

        const response = await fetch("http://localhost:8000/token", {
          method: "POST",
          headers: {
            "Content-Type": "application/x-www-form-urlencoded",
          },
          body: params.toString(),
        });

        if (!response.ok) {
          throw new Error("Login failed. Please check your credentials.");
        }

        const data = await response.json();
        // Store token in localStorage
        localStorage.setItem("token", data.access_token);
        router.push("/dashboard"); // Redirect to dashboard after login
      } else {
        // Registration logic
        const queryParams = new URLSearchParams({
          username: formData.username,
          password: formData.password,
          email: formData.email || "",
          display_name: formData.display_name || "",
        }).toString();

        const response = await fetch(`http://localhost:8000/register?${queryParams}`, {
          method: "POST",
        });

        if (!response.ok) {
          throw new Error("Registration failed. Please try again.");
        }

        // Switch to login mode after successful registration
        setIsLogin(true);
        setError("Registration successful! Please login.");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "An unknown error occurred");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <div className="flex-1 flex items-center justify-center">
        <div className="w-full max-w-md p-8 space-y-8 bg-gray-800 rounded-xl shadow-2xl">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-blue-500">Bonefire</h1>
            <p className="mt-2 text-gray-400">{isLogin ? "Sign in to your account" : "Create a new account"}</p>
          </div>
          
          {error && (
            <div className={`p-3 rounded-md ${error.includes("successful") ? "bg-green-800 text-green-200" : "bg-red-800 text-red-200"}`}>
              {error}
            </div>
          )}
          
          <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
              <div>
                <label htmlFor="username" className="block text-sm font-medium text-gray-400">
                  Username
                </label>
                <input
                  id="username"
                  name="username"
                  type="text"
                  required
                  value={formData.username}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-400">
                  Password
                </label>
                <input
                  id="password"
                  name="password"
                  type="password"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              {!isLogin && (
                <>
                  <div>
                    <label htmlFor="email" className="block text-sm font-medium text-gray-400">
                      Email (optional)
                    </label>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label htmlFor="display_name" className="block text-sm font-medium text-gray-400">
                      Display Name (optional)
                    </label>
                    <input
                      id="display_name"
                      name="display_name"
                      type="text"
                      value={formData.display_name}
                      onChange={handleChange}
                      className="mt-1 block w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </>
              )}
            </div>
            
            <div>
              <button
                type="submit"
                disabled={isLoading}
                className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoading ? (
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                ) : isLogin ? "Sign In" : "Register"}
              </button>
            </div>
          </form>
          
          <div className="text-center mt-4">
            <button
              className="text-blue-400 hover:text-blue-300 text-sm"
              onClick={() => setIsLogin(!isLogin)}
            >
              {isLogin ? "Need an account? Register" : "Already have an account? Sign In"}
            </button>
          </div>
          
          <div className="border-t border-gray-700 mt-6 pt-6 text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Bonefire. All rights reserved.
          </div>
        </div>
      </div>
    </div>
  );
};

export default Page;
