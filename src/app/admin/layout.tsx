"use client";
import { Toaster } from "~/components/ui/toaster";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "./components/Sidebar";
import Header from "./components/Header";

const AdminLayout = ({ children }: { children: React.ReactNode }) => {
  const router = useRouter();

  // useEffect(() => {
  //   const adminData = localStorage.getItem("adminData");
  //   if (!adminData) {
  //     router.push("/adminLogin");
  //   }
  // }, [router]);

  return (
    <div className="grid min-h-screen w-full md:grid-cols-[220px_1fr] lg:grid-cols-[280px_1fr]">
      <Sidebar />
      <div className="flex flex-col">
        <Header />
        <main className="flex flex-1 flex-col gap-4 bg-gradient-to-br from-[#0ca4d4] to-[#0076a8] p-4 lg:gap-6 lg:p-6">
          {children}
          <Toaster />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
