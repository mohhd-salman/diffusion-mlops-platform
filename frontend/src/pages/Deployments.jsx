import { useEffect, useState } from "react";
import axios from "../api/axiosClient";
import { Loader2, Server, GitBranch, Rocket, CheckCircle, XCircle, Search } from "lucide-react";
import { useNavigate } from "react-router-dom";

const StatusBadge = ({ status }) => {
  const statusConfig = {
    succeeded: { text: "Succeeded", styles: "bg-green-500/10 text-green-400 border-green-500/20" },
    failed: { text: "Failed", styles: "bg-red-500/10 text-red-400 border-red-500/20" },
    running: { text: "Running", styles: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20 animate-pulse" },
    building: { text: "Building", styles: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20 animate-pulse" },
    pending: { text: "Pending", styles: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20" },
  };
  const config = statusConfig[status] || { text: "Unknown", styles: "bg-slate-500/10 text-slate-400 border-slate-500/20" };

  return (
    <span className={`px-2.5 py-1 text-xs font-semibold rounded-full border ${config.styles}`}>
      {config.text}
    </span>
  );
};

export default function DeploymentsPage() {
  const [deploymentStats, setDeploymentStats] = useState({});
  const [deployments, setDeployments] = useState([]);
  const [filteredDeployments, setFilteredDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const navigate = useNavigate();

  useEffect(() => {
    setLoading(true);
    const fetchStats = axios.get("/deployments/status/stats");
    const fetchDeployments = axios.get("/deployments/");

    Promise.all([fetchStats, fetchDeployments])
      .then(([statsRes, deploymentsRes]) => {
        setDeploymentStats(statsRes.data);
        setDeployments(deploymentsRes.data.reverse());
      })
      .catch((err) => {
        console.error("Failed to fetch deployment data:", err);
        setDeploymentStats({});
        setDeployments([]);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const filtered = deployments.filter((deployment) => {
      const searchLower = search.toLowerCase();
      const matchesSearch =
        deployment.repo_full_name?.toLowerCase().includes(searchLower) ||
        deployment.branch?.toLowerCase().includes(searchLower);
      const matchesStatus = statusFilter ? deployment.status === statusFilter : true;
      return matchesSearch && matchesStatus;
    });
    setFilteredDeployments(filtered);
  }, [search, statusFilter, deployments]);

  const handleDeploymentClick = (deploymentId) => {
    console.log(`Navigating to deployment ${deploymentId}`);
  };

  const filterButtons = ["All", "building", "succeeded", "failed"];

  return (
    <div className="bg-gray-900/70 min-h-screen text-slate-300 font-sans">
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div>
          <div className="flex justify-between items-center pb-6 border-b border-slate-700/50 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Server className="text-emerald-500" />
                Deployments
              </h1>
              <p className="text-sm text-slate-400 mt-1">Monitor all deployment activities across your projects.</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="bg-gray-800/50 p-6 rounded-xl border border-slate-700/50 group hover:border-emerald-500/50 transition-all duration-30]]">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-slate-400">Total Deployments</h4>
              <Rocket className="w-6 h-6 text-slate-500 group-hover:text-emerald-400 transition-colors" />
            </div>
            <p className="text-3xl font-bold text-white mt-2">{deploymentStats["Total"] || 0}</p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-xl border border-slate-700/50 group hover:border-green-500/50 transition-all duration-300">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-slate-400">Succeeded</h4>
              <CheckCircle className="w-6 h-6 text-slate-500 group-hover:text-green-400 transition-colors" />
            </div>
            <p className="text-3xl font-bold text-green-400 mt-2">{deploymentStats["Succeeded"] || 0}</p>
          </div>
          <div className="bg-gray-800/50 p-6 rounded-xl border border-slate-700/50 group hover:border-red-500/50 transition-all duration-300">
            <div className="flex justify-between items-center">
              <h4 className="text-sm font-medium text-slate-400">Failed</h4>
              <XCircle className="w-6 h-6 text-slate-500 group-hover:text-red-400 transition-colors" />
            </div>
            <p className="text-3xl font-bold text-red-400 mt-2">{deploymentStats["Failed"] || 0}</p>
          </div>
        </div>

        <div className="bg-gray-800/50 p-4 sm:p-6 rounded-xl border border-slate-700/50">
          <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
            <div className="flex items-center gap-2 bg-slate-900/50 border border-slate-700/50 p-1 rounded-lg">
              {filterButtons.map((status) => (
                <button
                  key={status}
                  onClick={() => setStatusFilter(status === "All" ? "" : status)}
                  className={`px-3 py-1.5 text-sm font-semibold rounded-md transition-colors duration-200 ${
                    (statusFilter === status || (status === "All" && !statusFilter))
                      ? "bg-emerald-600 text-white"
                      : "text-slate-400 hover:bg-slate-700/50"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>
            <div className="relative w-full sm:w-auto">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
              <input
                type="text"
                placeholder="Search"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-900/80 text-slate-300 border border-slate-600/80 p-2 pl-10 pr-4 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:outline-none w-full sm:w-64"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex justify-center items-center h-64">
                <Loader2 className="w-8 h-8 animate-spin text-emerald-500" />
              </div>
            ) : (
              <table className="min-w-full divide-y divide-slate-700/50">
                <thead className="bg-slate-900/30">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Deployment</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Branch</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Endpoint</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Triggered</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700/50">
                  {filteredDeployments.length > 0 ? (
                    filteredDeployments.map((d) => (
                      <tr
                        key={d.id}
                        onClick={() => handleDeploymentClick(d.id)}
                        className="hover:bg-slate-700/50 cursor-pointer transition-colors duration-200"
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-white">{d.repo_full_name}</div>
                          <div className="text-xs text-slate-400">ID: {d.id}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center gap-2 text-sm text-slate-400">
                            <GitBranch className="w-4 h-4 text-emerald-400" />
                            {d.branch}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {d.endpoint_url ? (
                          <a
                            href={d.endpoint_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-block px-3 py-1 text-emerald-400 border border-transparent rounded-full transition-colors duration-200 hover:bg-emerald-500/10 hover:border-emerald-500/30"
                          >
                            {d.endpoint_url}
                          </a>
                        ) : (
                          <span className="inline-block px-3 py-1">N/A</span>
                        )}
                      </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                          {new Date(d.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusBadge status={d.status} />
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="4" className="text-center py-10 text-slate-500">
                        No deployments match your criteria.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}