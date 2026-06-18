// src/components/Sidebar.jsx
import { NavLink } from "react-router-dom";

export default function Sidebar() {
  return (
    <aside className="w-64 h-screen bg-gray-900 text-gray-100 flex flex-col">
      <div className="px-6 py-4 text-xl font-bold border-b border-gray-700">
        FaxNova Admin
      </div>

      <nav className="flex-1 px-4 py-6 space-y-2">
        <NavLink
          to="/outbound"
          className={({ isActive }) =>
            `block px-3 py-2 rounded-md ${
              isActive ? "bg-gray-700" : "hover:bg-gray-800"
            }`
          }
        >
          Outbound Faxes
        </NavLink>

        <NavLink
          to="/inbound"
          className={({ isActive }) =>
            `block px-3 py-2 rounded-md ${
              isActive ? "bg-gray-700" : "hover:bg-gray-800"
            }`
          }
        >
          Inbound Faxes
        </NavLink>

        <NavLink
          to="/residency"
          className={({ isActive }) =>
            `block px-3 py-2 rounded-md ${
              isActive ? "bg-gray-700" : "hover:bg-gray-800"
            }`
          }
        >
          Residency
        </NavLink>

        <NavLink
          to="/providers"
          className={({ isActive }) =>
            `block px-3 py-2 rounded-md ${
              isActive ? "bg-gray-700" : "hover:bg-gray-800"
            }`
          }
        >
          Providers
        </NavLink>

        <NavLink
          to="/audit"
          className={({ isActive }) =>
            `block px-3 py-2 rounded-md ${
              isActive ? "bg-gray-700" : "hover:bg-gray-800"
            }`
          }
        >
          Audit Logs
        </NavLink>

        <NavLink
          to="/settings"
          className={({ isActive }) =>
            `block px-3 py-2 rounded-md ${
              isActive ? "bg-gray-700" : "hover:bg-gray-800"
            }`
          }
        >
          Settings
        </NavLink>
      </nav>
    </aside>
  );
}
