import { useState } from "react";
import Sidebar from "../components/Sidebar";
import ProfileDropdown from "../components/ProfileDropdown";
import SearchUsers from "../components/SearchUsers";
import { Outlet } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { dummyUserData } from "../assets/assets";
import Loading from "../components/Loading";
import { useSelector } from 'react-redux'
const Layout = () => {
  const user = useSelector((state) => state.user.value
);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  return user? (
    <div className="w-full flex h-screen">
      <Sidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
      <div className="flex-1 bg-slate-50 flex flex-col">
        {/* Top Bar with Search and Profile Dropdown */}
        <div className="flex items-center justify-between gap-4 px-6 py-3 bg-white border-b border-gray-200 shadow-sm">
          <SearchUsers />
          <ProfileDropdown />
        </div>
        
        {/* Main Content */}
        <div className="flex-1 overflow-auto">
          <Outlet />
        </div>
      </div>
      {sidebarOpen ? (
        <X className="absolute top-3 right-3 p-2 z-100 bg-white rounded-md shadow w-10 h-10 text-gray-600 sm:hidden" onClick={() => setSidebarOpen(false)} />
      ) : (
        <Menu className="absolute top-3 right-3 p-2 z-100 bg-white rounded-md shadow w-10 h-10 text-gray-600 sm:hidden" onClick={() => setSidebarOpen(true)}/>
      )}
    </div>
  ) : (
    <h1><Loading /></h1>
  )
};

export default Layout;
