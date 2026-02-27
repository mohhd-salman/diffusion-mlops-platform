import { useEffect, useState } from "react";
import axios from "../api/axiosClient";
import { useNavigate } from "react-router-dom";
import { PlusCircle, Search, GitBranch, Github } from "lucide-react";
import NewProjectModal from "../components/NewProjectModal";

const StatusBadge = ({ status }) => {
  const statusStyles = {
    succeeded: "bg-green-500/20 text-green-400 border-green-500/30",
    running: "bg-blue-500/20 text-blue-400 border-blue-500/30 animate-pulse",
    building: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30 animate-pulse",
    pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
    failed: "bg-red-500/20 text-red-400 border-red-500/30",
    archived: "bg-gray-500/20 text-gray-400 border-gray-500/30",
    active: "bg-green-500/20 text-green-400 border-green-500/30",
  };

  const statusText = {
    succeeded: "Succeeded",
    running: "Running",
    building: "Building",
    pending: "Pending",
    failed: "Failed",
    archived: "Archived",
    active: "Active",
  };

  return (
    <span
      className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${
        statusStyles[status] || statusStyles.archived
      }`}
    >
      {statusText[status] || "Unknown"}
    </span>
  );
};

export default function ProjectPage() {
  const [totalProjects, setTotalProjects] = useState(0);
  const [activeProjects, setActiveProjects] = useState(0);
  const [archivedProjects, setArchivedProjects] = useState(0);
  // --- END FIX ---

  const [projects, setProjects] = useState([]);
  const [filteredProjects, setFilteredProjects] = useState([]);
  const [search, setSearch] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const navigate = useNavigate();

  const fetchData = () => {
    axios
      .get("/projects/total/projects")
      .then((res) => setTotalProjects(res.data))
      .catch((err) => console.error("Error fetching total projects:", err));

    axios
      .get("/projects/status/active")
      .then((res) => setActiveProjects(res.data))
      .catch((err) => console.error("Error fetching active projects:", err));

    axios
      .get("/projects/status/archived")
      .then((res) => setArchivedProjects(res.data))
      .catch((err) => console.error("Error fetching archived projects:", err));

    axios
      .get("/projects/")
      .then((res) => {
        if (Array.isArray(res.data)) {
          setProjects(res.data);
        } else {
          console.error("API /projects did not return an array:", res.data);
          setProjects([]);
        }
      })
      .catch((err) => {
        console.error("Error fetching projects:", err);
        setProjects([]);
      });
  };

  useEffect(() => {
    fetchData();
  }, []);

  useEffect(() => {
    const query = search.toLowerCase();
    if (!query) {
      setFilteredProjects(projects);
    } else {
      setFilteredProjects(
        projects.filter(
          (p) =>
            p.repo_full_name?.toLowerCase().includes(query) ||
            p.branch?.toLowerCase().includes(query)
        )
      );
    }
  }, [search, projects]);

  const handleProjectClick = (projectId) => navigate(`/projects/${projectId}`);
  const handleModalClose = () => setIsModalOpen(false);
  const handleNewProjectCreated = () => {
    fetchData();
    setIsModalOpen(false);
  };

  return (
    <div className="bg-gray-900/70 min-h-screen text-gray-300 font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center pb-6 border-b border-gray-700/50 mb-8">
          <div>
            <h1 className="text-2xl font-bold text-white">
              Projects Dashboard
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              Manage your model deployments and monitor their status.
            </p>
          </div>
          <button
            onClick={() => setIsModalOpen(true)}
            className="mt-4 sm:mt-0 bg-emerald-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all duration-300 ease-in-out hover:bg-gray-700 hover:text-emerald-600 focus:ring-4 focus:ring-blue-500/50 focus:outline-none"
            aria-label="Add New Project"
          >
            <PlusCircle className="w-5 h-5" />
            New Project
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 hover:border-emerald-500/50">
            <h4 className="text-sm font-medium text-gray-400">
              Total Projects
            </h4>
            <p className="text-3xl font-bold text-white mt-2">
              {totalProjects}
            </p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 hover:border-emerald-500/50">
            <h4 className="text-sm font-medium text-gray-400">
              Active Projects
            </h4>
            <p className="text-3xl font-bold text-green-400 mt-2">
              {activeProjects}
            </p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50 hover:border-red-500/50">
            <h4 className="text-sm font-medium text-gray-400">
              Archived Projects
            </h4>
            <p className="text-3xl font-bold text-red-400 mt-2">
              {archivedProjects}
            </p>
          </div>
        </div>

        <div className="bg-gray-800/50 p-6 rounded-xl border border-gray-700/50">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-semibold text-white">All Projects</h3>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500" />
              <input
                type="text"
                placeholder="Search projects..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-gray-900/80 text-gray-300 border border-gray-600/80 p-2 pl-10 pr-4 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none w-full sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-700/50">
              <thead className="bg-gray-900/30">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                  >
                    Repository
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                  >
                    Branch
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                  >
                    Last Deployed
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="bg-gray-800/50 divide-y divide-gray-700/50">
                {filteredProjects.length > 0 ? (
                  filteredProjects.map((p) => (
                    <tr
                      key={p.id}
                      onClick={() => handleProjectClick(p.id)}
                      className="hover:bg-gray-700/50 cursor-pointer transition-colors duration-200"
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <Github className="w-5 h-5 text-gray-500" />
                          <div className="text-sm font-medium text-white">
                            {p.repo_full_name}
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-400">
                          <GitBranch className="w-4 h-4" />
                          {p.branch}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-400">
                        {p.last_deployed_at
                          ? new Date(p.last_deployed_at).toLocaleString()
                          : "N/A"}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={p.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="4" className="text-center py-10 text-gray-500">
                      No projects found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      <NewProjectModal
        open={isModalOpen}
        onClose={handleModalClose}
        onCreated={handleNewProjectCreated}
      />
    </div>
  );
}
