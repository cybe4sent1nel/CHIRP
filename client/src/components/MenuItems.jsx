import { NavLink } from "react-router-dom";
import { menuItemsData } from "../assets/assets";
import { useState } from "react";
import NotificationBadge from "./NotificationBadge";

const MenuItems = ({ setSidebarOpen }) => {
  const [notificationCount] = useState(3);

  return (
    <div className="px-6 text-gray-600 space-y-1 font-medium">
      {menuItemsData.map(({ to, label, Icon }) => (
        <NavLink
          key={to}
          to={to}
          end={to === "/"}
          onClick={() => setSidebarOpen(false)}
          className={({ isActive }) =>
            `px-3.5 py-3 flex items-center gap-3 rounded-full transition-all duration-200 ${
              isActive 
                ? "bg-indigo-100 text-indigo-700 font-semibold" 
                : "hover:bg-gray-100"
            }`
          }
        >
          <div className="relative">
            <Icon className="w-6 h-6" />
            {label === "Notifications" && notificationCount > 0 && (
              <NotificationBadge count={notificationCount} />
            )}
          </div>
          <span className="text-base">{label}</span>
        </NavLink>
      ))}
    </div>
  );
};

export default MenuItems;
