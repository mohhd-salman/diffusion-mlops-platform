import Sidebar from "@/components/Sidebar";
import { Outlet } from "react-router-dom";

export default function Layout() {
  return (
    <div className="flex h-screen bg-[#0d1117] text-gray-200">
      {/* Sidebar stays fixed */}
      <Sidebar />

      {/* Page content changes here */}
      <div className="flex-1 overflow-y-auto">
        <Outlet />
      </div>
    </div>
  );
}
