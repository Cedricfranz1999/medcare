"use client";
import Link from "next/link";
import {
  LayoutDashboard,
  ClipboardList,
  Pill,
  Users,
  FileText,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { Label } from "~/components/ui/label";
import { usePathname, useRouter } from "next/navigation";
import { useState } from "react";

const Sidebar = () => {
  const router = useRouter();
  const pathname = usePathname();
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>(
    {},
  );

  const isActive = (path: string) => pathname.startsWith(path);

  const toggleMenu = (menu: string) => {
    setExpandedMenus((prev) => ({
      ...prev,
      [menu]: !prev[menu],
    }));
  };

  return (
    <div className="hidden bg-gradient-to-b from-[#0ac2de] via-[#0fa7d1] to-[#156cbc] md:block">
      <div className="flex h-full max-h-screen flex-col gap-2">
        <div className="flex h-14 items-center border-b border-white/20 px-4 lg:h-[60px] lg:px-6">
          <Label className="text-xl font-bold text-white">MEDCARE</Label>
        </div>
        <div className="mt-6 flex-1">
          <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
            {/* Dashboard */}
            <div>
              <div className="flex items-center justify-between">
                <Link
                  href="/admin/dashboard"
                  className={`flex flex-1 items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                    isActive("/admin/dashboard")
                      ? "bg-white text-[#156cbc]"
                      : "text-white hover:bg-[#0ca4d4] hover:text-white"
                  }`}
                >
                  <LayoutDashboard className="h-4 w-4" />
                  Dashboard
                </Link>
              </div>
            </div>

            {/* Requests */}
            <div>
              <div className="flex items-center justify-between">
                <Link
                  href="/admin/requests"
                  className={`flex flex-1 items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                    isActive("/admin/requests")
                      ? "bg-white text-[#156cbc]"
                      : "text-white hover:bg-[#0ca4d4] hover:text-white"
                  }`}
                >
                  <ClipboardList className="h-4 w-4" />
                  Requests
                </Link>
              </div>
            </div>

            {/* Medicine - with margin top */}
            <div className="mt-6">
              <div className="flex items-center justify-between">
                <Link
                  href="/admin/medicine/list"
                  className={`flex flex-1 items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                    isActive("/admin/medicine/list")
                      ? "bg-white text-[#156cbc]"
                      : "text-white hover:bg-[#0ca4d4] hover:text-white"
                  }`}
                >
                  <Pill className="h-4 w-4" />
                  Medicine
                </Link>
                <button
                  onClick={() => toggleMenu("/admin/medicine/list")}
                  className="p-2 text-white"
                >
                  {expandedMenus["/admin/medicine/list"] ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </button>
              </div>
              {expandedMenus["/admin/medicine/list"] && (
                <div className="ml-4">
                  <Link
                    href="/admin/medicine/list"
                    className={`mt-3 flex items-center gap-3 rounded-lg px-3 py-2 text-xs transition-all ${
                      isActive("/admin/medicine/list")
                        ? "bg-white/80 text-[#156cbc]"
                        : "text-white/80 hover:bg-[#0ca4d4] hover:text-white"
                    }`}
                  >
                    <span className="ml-4">list</span>
                  </Link>
                  <Link
                    href="/admin/medicine/category"
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs transition-all ${
                      isActive("/admin/medicine/category")
                        ? "bg-white/80 text-[#156cbc]"
                        : "text-white/80 hover:bg-[#0ca4d4] hover:text-white"
                    }`}
                  >
                    <span className="ml-4">category</span>
                  </Link>

                  <Link
                    href="/admin/medicine/recommended"
                    className={`flex items-center gap-3 rounded-lg px-3 py-2 text-xs transition-all ${
                      isActive("/admin/medicine/recommended")
                        ? "bg-white/80 text-[#156cbc]"
                        : "text-white/80 hover:bg-[#0ca4d4] hover:text-white"
                    }`}
                  >
                    <span className="ml-4">recommended</span>
                  </Link>
                </div>
              )}
            </div>

            {/* Users */}
            <div>
              <div className="flex items-center justify-between">
                <Link
                  href="/admin/users"
                  className={`flex flex-1 items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                    isActive("/admin/users")
                      ? "bg-white text-[#156cbc]"
                      : "text-white hover:bg-[#0ca4d4] hover:text-white"
                  }`}
                >
                  <Users className="h-4 w-4" />
                  Users
                </Link>
              </div>
            </div>

            {/* Reports */}
            <div>
              <div className="flex items-center justify-between">
                <Link
                  href="/admin/reports"
                  className={`flex flex-1 items-center gap-3 rounded-lg px-3 py-2 transition-all ${
                    isActive("/admin/reports")
                      ? "bg-white text-[#156cbc]"
                      : "text-white hover:bg-[#0ca4d4] hover:text-white"
                  }`}
                >
                  <FileText className="h-4 w-4" />
                  Reports
                </Link>
              </div>
            </div>
          </nav>
        </div>
        <div className="mt-auto py-10"></div>
      </div>
    </div>
  );
};

export default Sidebar;
