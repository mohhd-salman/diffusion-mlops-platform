import React, { useState } from "react";

export default function Login() {
  const [loading, setLoading] = useState(false);
  const API_URL = import.meta.env.VITE_API_BASE_URL;

  const handleGithubLogin = () => {
    setLoading(true);
    window.location.href = `${API_URL}/auth/github/login`;
  };

  return (
    <main className="min-h-screen flex flex-col items-center justify-center bg-[#0d1117] text-white">
      <h1 className="text-2xl font-bold mb-2">Log in</h1>
      <p className="text-gray-400 text-sm mb-6">Use your GitHub account</p>

      <button
        type="button"
        aria-label="Log in with GitHub"
        onClick={handleGithubLogin}
        disabled={loading}
        className={`group flex items-center justify-center gap-3 w-80 h-10 rounded-md border font-medium transition-all duration-200 ease-in-out ${
          loading
            ? "bg-gray-800 border-gray-700 cursor-not-allowed opacity-70 text-white"
            : "bg-transparent border-gray-500 text-white hover:bg-white hover:text-black"
        }`}
      >
        {!loading && (
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            className="fill-white group-hover:fill-black transition-colors duration-200"
          >
            <path d="M12 .5C5.65.5.5 5.65.5 12c0 5.1 3.3 9.4 7.9 10.9.6.1.8-.3.8-.6v-2.2c-3.2.7-3.8-1.5-3.8-1.5-.6-1.5-1.4-1.9-1.4-1.9-1.1-.7.1-.7.1-.7 1.2.1 1.8 1.2 1.8 1.2 1 .1.8 2.2.8 2.2.5 1.2 1.9.9 2.4.7.1-.6.4-1 .7-1.3-2.6-.3-5.3-1.3-5.3-6 0-1.3.5-2.4 1.2-3.3-.1-.3-.5-1.6.1-3.3 0 0 1-.3 3.4 1.2a11.7 11.7 0 0 1 6.2 0c2.4-1.5 3.4-1.2 3.4-1.2.6 1.7.2 3 .1 3.3.7.9 1.2 2 1.2 3.3 0 4.7-2.7 5.7-5.3 6 .5.4.9 1.2.9 2.5v3.6c0 .3.2.7.8.6C20.7 21.4 24 17.1 24 12 24 5.65 18.35.5 12 .5z" />
          </svg>
        )}
        <span>{loading ? "Redirecting..." : "Log in with GitHub"}</span>
      </button>

      <p className="text-gray-500 text-xs mt-8 text-center">
        By logging in, you agree to our{" "}
        <a href="#" className="text-blue-400 hover:underline">
          terms of service
        </a>{" "}
        and{" "}
        <a href="#" className="text-blue-400 hover:underline">
          privacy policy
        </a>.
      </p>
    </main>
  );
}
