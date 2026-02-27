import { useEffect, useState, useRef } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Rocket,
  ChevronUp,
  LogOut,
  Server,
  Sparkles,
} from "lucide-react";
import axios from "../api/axiosClient";
import ImageGenerationModal from "../components/ImageGenerationModal";

const navItems = [
  { name: "Projects", icon: LayoutDashboard, to: "/projects" },
  { name: "Deployments", icon: Server, to: "/deployments" },
];

export default function Sidebar() {
  const [user, setUser] = useState(null);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const [isGenOpen, setIsGenOpen] = useState(false);
  const [deployments, setDeployments] = useState([]);

  const navigate = useNavigate();
  const userMenuRef = useRef(null);

  useEffect(() => {
    axios
      .get("/auth/me")
      .then((res) => setUser(res.data))
      .catch(() => navigate("/"));
  }, [navigate]);

  useEffect(() => {
    axios
      .get("/deployments/")
      .then((res) => setDeployments(res.data))
      .catch((e) => console.warn("Failed to load deployments:", e));
  }, []);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setIsUserMenuOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [userMenuRef]);

  const handleLogout = async () => {
    try {
      await axios.post("/auth/logout");
    } catch (e) {
      console.warn("Logout failed:", e);
    } finally {
      setUser(null);
      navigate("/");
    }
  };

  return (
    <>
      <aside className="w-64 h-screen flex flex-col bg-slate-800/50 border-r border-slate-700/50 shadow-2xl">
        <div className="flex flex-col flex-grow">
          <div className="flex items-center gap-3 px-6 py-5 border-b border-slate-700/50">
            <Rocket className="w-7 h-7 text-emerald-500" />
            <h1 className="text-lg font-bold text-white">MLOps Deploy</h1>
          </div>

          <nav className="mt-6 px-4 flex flex-col gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.name}
                to={item.to}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 ${
                    isActive
                      ? "bg-emerald-500/10 text-white border-l-2 border-emerald-500"
                      : "text-slate-400 hover:bg-slate-700/50 hover:text-white"
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span>{item.name}</span>
              </NavLink>
            ))}

            <button
              onClick={() => setIsGenOpen(true)}
              className="flex items-center gap-3 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors duration-200 text-slate-400 hover:bg-slate-700/50 hover:text-white"
            >
              <Sparkles className="w-5 h-5" />
              <span>Generate Image</span>
            </button>
          </nav>
        </div>

        <div
          className="px-4 py-4 border-t border-slate-700/50 relative"
          ref={userMenuRef}
        >
          {user && (
            <>
              {isUserMenuOpen && (
                <div className="absolute bottom-full left-4 right-4 mb-2 bg-slate-700 border border-slate-600/50 rounded-lg shadow-lg">
                  <button
                    onClick={handleLogout}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-400 hover:bg-red-500/10 hover:text-red-300 rounded-lg transition-colors"
                  >
                    <LogOut className="w-5 h-5" />
                    <span>Logout</span>
                  </button>
                </div>
              )}

              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="w-full flex items-center justify-between text-left p-2 rounded-lg hover:bg-slate-700/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-slate-600 rounded-full flex items-center justify-center font-bold text-white">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-sm text-white">
                      {user.username}
                    </div>
                    <div className="text-xs text-slate-400">{user.email}</div>
                  </div>
                </div>
                <ChevronUp
                  className={`w-5 h-5 text-slate-400 transition-transform duration-300 ${
                    isUserMenuOpen ? "rotate-0" : "rotate-180"
                  }`}
                />
              </button>
            </>
          )}
        </div>
      </aside>

      <ImageGenerationModal
        isOpen={isGenOpen}
        onClose={() => setIsGenOpen(false)}
        deployments={deployments}
      />
    </>
  );
}