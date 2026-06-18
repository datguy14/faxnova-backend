// src/App.jsx
import Sidebar from "./components/Sidebar";
import { Outlet } from "react-router-dom";

export default function App() {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 p-6 bg-gray-50 min-h-screen">
        <Outlet />
      </main>
    </div>
  );
}
