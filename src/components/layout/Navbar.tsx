"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

export default function Navbar() {
  const router = useRouter();

  const logoutHandler = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    router.push("/login");
  };

  return (
    <nav className="bg-green-700 text-white px-8 py-4 flex items-center justify-between shadow-md">
      <h1 className="text-2xl font-bold">
        Farmify AI
      </h1>

      <div className="flex items-center gap-6">
        <Link href="/dashboard">
          Dashboard
        </Link>

        <button
          onClick={logoutHandler}
          className="bg-white text-green-700 px-4 py-2 rounded-lg font-medium"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}