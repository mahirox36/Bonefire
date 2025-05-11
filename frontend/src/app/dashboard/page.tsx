"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

interface User {
  username: string;
  display_name?: string;
  email?: string;
}

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const fetchUserData = async () => {
      const token = localStorage.getItem("token");
      
      if (!token) {
        router.push("/login");
        return;
      }

      try {
        const response = await fetch("http://localhost:8000/users/me", {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });

        if (!response.ok) {
          if (response.status === 401) {
            localStorage.removeItem("token");
            router.push("/login");
            return;
          }
          throw new Error("Failed to fetch user data");
        }

        const userData = await response.json();
        setUser(userData);
      } catch (err) {
        setError(err instanceof Error ? err.message : "An unknown error occurred");
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [router]);

  const handleLogout = () => {
    localStorage.removeItem("token");
    router.push("/login");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center">
          <svg className="animate-spin h-12 w-12 mx-auto text-blue-500" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <p className="mt-4">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-900 text-white">
        <div className="text-center p-8 max-w-md bg-gray-800 rounded-xl shadow-2xl">
          <div className="text-red-500 text-5xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold mb-4">Error Loading Dashboard</h1>
          <p className="mb-6">{error}</p>
          <button 
            onClick={() => router.push("/login")}
            className="px-4 py-2 bg-blue-600 rounded hover:bg-blue-700"
          >
            Return to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-900 text-white">
      <header className="bg-gray-800 shadow-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-blue-500">Bonefire</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-300">Welcome, {user?.display_name || user?.username}</span>
            <button
              onClick={handleLogout}
              className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded"
            >
              Logout
            </button>
          </div>
        </div>
      </header>
      
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800 shadow-xl rounded-lg p-8">
          <h2 className="text-2xl font-bold mb-6">Your Dashboard</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-gray-700 p-6 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-3">Profile Information</h3>
              <div className="space-y-2 text-gray-300">
                <p><span className="text-gray-400">Username:</span> {user?.username}</p>
                <p><span className="text-gray-400">Display Name:</span> {user?.display_name || "Not set"}</p>
                <p><span className="text-gray-400">Email:</span> {user?.email || "Not set"}</p>
              </div>
            </div>
            
            <div className="bg-gray-700 p-6 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-3">Recent Activity</h3>
              <div className="text-gray-400 text-sm">
                <p>No recent activity to display.</p>
              </div>
            </div>

            <div className="bg-gray-700 p-6 rounded-lg shadow">
              <h3 className="font-semibold text-lg mb-3">Quick Actions</h3>
              <div className="space-y-3">
                <button className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded text-sm">
                  Edit Profile
                </button>
                <button className="w-full py-2 bg-indigo-600 hover:bg-indigo-700 rounded text-sm">
                  Connect to Pyre Channel
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <p className="text-center text-xs text-gray-500">
            &copy; {new Date().getFullYear()} Bonefire. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}