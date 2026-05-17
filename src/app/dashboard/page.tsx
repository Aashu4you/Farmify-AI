"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Navbar from "@/components/layout/Navbar";
import StatCard from "@/components/dashboard/StatCard";
import QuickActions from "@/components/dashboard/QuickActions";

export default function DashboardPage() {
  const router = useRouter();

  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      router.push("/login");
    } else {
      setUser(JSON.parse(storedUser));
    }
  }, []);

  return (
    <>
      <Navbar />

      <div className="min-h-screen bg-green-50 p-8">
        <h1 className="text-4xl font-bold text-green-700 mb-4">
          Farmify Dashboard
        </h1>

        {user && (
          <div className="bg-white p-6 rounded-xl shadow-md max-w-md">
            <h2 className="text-2xl font-semibold mb-2">
              Welcome, {user.name}
            </h2>

            <p className="text-gray-600">
              Email: {user.email}
            </p>

            <p className="text-gray-600">
              Role: {user.role}
            </p>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-8">
          <StatCard
            title="Total Crops"
            value="12"
          />

          <StatCard
            title="Active Tasks"
            value="8"
          />

          <StatCard
            title="Revenue"
            value="₹45,000"
          />
        </div>

        <QuickActions />
      </div>
    </>
  );
}