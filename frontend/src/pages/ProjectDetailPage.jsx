import { useEffect, useState, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "../api/axiosClient";
import { Button } from "@/components/ui/button";
import {
  GitBranch,
  Loader2,
  Server,
  Trash2,
  Archive,
  ArchiveRestore,
  CheckCircle,
  XCircle,
  Info,
} from "lucide-react";

const StatusBadge = ({ status }) => {
  const statusConfig = {
    succeeded: {
      text: "Succeeded",
      styles: "bg-green-500/10 text-green-400 border-green-500/20",
      icon: CheckCircle,
    },
    failed: {
      text: "Failed",
      styles: "bg-red-500/10 text-red-400 border-red-500/20",
      icon: XCircle,
    },
    building: {
      text: "Building",
      styles: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
      icon: Loader2,
    },
  };
  const config = statusConfig[status] || {
    text: "Unknown",
    styles: "bg-slate-500/10 text-slate-400 border-slate-500/20",
    icon: Info,
  };
  const Icon = config.icon;

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-semibold rounded-full border ${config.styles}`}
    >
      <Icon
        className={`w-3 h-3 ${
          ["building"].includes(status) ? "animate-spin" : ""
        }`}
      />
      {config.text}
    </span>
  );
};

export default function ProjectDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [project, setProject] = useState(null);
  const [deployments, setDeployments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isDeploying, setIsDeploying] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [notification, setNotification] = useState({ message: "", type: "" });

  const previousDeploymentsRef = useRef([]);

  const fetchData = async (isPolling = false) => {
    try {
      const projectRes = await axios.get(`/projects/${id}`);
      setProject(projectRes.data);
      const deploymentsRes = await axios.get(`/deployments/?project_id=${id}`);
      const newDeployments = deploymentsRes.data.reverse();
      setDeployments(newDeployments);

      if (isPolling) {
        const oldLatest = previousDeploymentsRef.current[0];
        const newLatest = newDeployments[0];

        if (oldLatest && newLatest && oldLatest.id === newLatest.id) {
          const wasBuilding = ["building"].includes(oldLatest.status);
          const isNowSucceeded = newLatest.status === "succeeded";
          const isNowFailed = newLatest.status === "failed";

          if (wasBuilding && isNowSucceeded) {
            showNotification("Deployment succeeded", "success");
          }
          if (wasBuilding && isNowFailed) {
            showNotification(
              "Deployment failed. Check logs for details.",
              "error"
            );
          }
        }
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
      if (!isPolling) {
        showNotification("Could not load project data.", "error");
      }
    }
  };

  useEffect(() => {
    previousDeploymentsRef.current = deployments;
  }, [deployments]);

  useEffect(() => {
    setLoading(true);
    fetchData().finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    const latestDeployment = deployments[0];
    const isDeploymentActive =
      latestDeployment && ["building"].includes(latestDeployment.status);

    if (isDeploymentActive) {
      const intervalId = setInterval(() => {
        console.log("Polling for status update...");
        fetchData(true);
      }, 10000);
      return () => clearInterval(intervalId);
    }
  }, [deployments, id]);

  const showNotification = (message, type) => {
    setNotification({ message, type });
    setTimeout(() => setNotification({ message: "", type: "" }), 5000);
  };

  const handleDeploy = async () => {
    setIsDeploying(true);
    try {
      const response = await axios.post(`/deployments/start/${id}`, {
        project_id: id,
        repo_full_name: project.repo_full_name,
        repo_url: project.repo_url,
        branch: project.branch,
      });

      const newDeployment = response.data;

      if (newDeployment.status === "failed") {
        showNotification(
          "Deployment failed to start. Check connection.",
          "error"
        );
      } else {
        showNotification("Deployment started successfully!", "success");
      }

      await fetchData();
    } catch (err) {
      showNotification("Failed to trigger deployment.", "error");
    } finally {
      setIsDeploying(false);
    }
  };

  const handleArchive = async () => {
    try {
      await axios.put(`/projects/${id}`, { status: "archived" });
      setProject((prev) => ({ ...prev, status: "archived" }));
      showNotification("Project archived successfully.", "success");
    } catch (err) {
      showNotification("Failed to archive project.", "error");
    }
  };

  const handleActivate = async () => {
    try {
      await axios.put(`/projects/${id}`, { status: "active" });
      setProject((prev) => ({ ...prev, status: "active" }));
      showNotification("Project activated successfully.", "success");
    } catch (err) {
      showNotification("Failed to activate project.", "error");
    }
  };

  const handleDelete = async () => {
    try {
      await axios.delete(`/projects/${id}`);
      showNotification("Project deleted successfully!", "success");
      setTimeout(() => navigate("/projects"), 1500);
    } catch (err) {
      showNotification("Failed to delete project.", "error");
    } finally {
      setShowDeleteModal(false);
    }
  };

  const isDeploymentInProgress = deployments.some((d) =>
    ["building"].includes(d.status)
  );

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen bg-slate-900">
        <Loader2 className="w-10 h-10 animate-spin text-emerald-500" />
      </div>
    );
  }

  if (!project)
    return (
      <div className="text-center text-slate-400 p-8">Project not found.</div>
    );

  return (
    <div className="bg-gray-900/70 min-h-screen text-slate-300 font-sans">
      {notification.message && (
        <div
          className={`fixed top-5 right-5 px-4 py-2 rounded-lg text-white shadow-lg ${
            notification.type === "success" ? "bg-green-600" : "bg-red-600"
          }`}
        >
          {notification.message}
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-gray-800/50 p-6 rounded-xl border border-slate-700/50 mb-8">
          <div className="flex flex-col md:flex-row justify-between items-start">
            <div>
              <h1 className="text-2xl font-bold text-white">
                {project.repo_full_name}
              </h1>
              <div className="flex items-center gap-4 text-sm text-slate-400 mt-2">
                <span className="flex items-center gap-1.5">
                  <GitBranch className="w-4 h-4" /> {project.branch}
                </span>
                <span>
                  Created: {new Date(project.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-3 mt-4 md:mt-0">
              {project.status === "active" ? (
                <>
                  <Button
                    onClick={handleDeploy}
                    disabled={isDeploying || isDeploymentInProgress}
                    className="bg-emerald-600 text-white px-5 py-2 rounded-lg flex items-center gap-2 transition-all hover:bg-emerald-700 disabled:bg-slate-600 disabled:cursor-not-allowed"
                  >
                    {isDeploying || isDeploymentInProgress ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" /> In
                        Progress...
                      </>
                    ) : (
                      <>
                        <Server className="w-4 h-4" /> Deploy
                      </>
                    )}
                  </Button>
                  <Button
                    onClick={handleArchive}
                    variant="outline"
                    className="text-yellow-400 border-yellow-500/50 hover:bg-gray-700 bg-yellow-500/10 hover:text-yellow-300 px-4 py-2 flex items-center gap-2"
                  >
                    <Archive className="w-4 h-4" /> Archive
                  </Button>
                </>
              ) : (
                <Button
                  onClick={handleActivate}
                  variant="outline"
                  className="text-green-400 border-green-500/50 bg-green-500/10 hover:bg-gray-700 hover:text-green-300 px-4 py-2 flex items-center gap-2"
                >
                  <ArchiveRestore className="w-4 h-4" /> Activate
                </Button>
              )}
              <Button
                variant="outline"
                onClick={() => setShowDeleteModal(true)}
                className="text-red-400 border-red-500/50 bg-red-500/10 hover:bg-gray-700 hover:text-red-300 px-4 py-2"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>

        <div className="bg-gray-800/50 p-4 sm:p-6 rounded-xl border border-slate-700/50">
          <h3 className="text-lg font-semibold text-white mb-4">
            Deployment History
          </h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-700/50">
              <thead className="bg-slate-900/30">
                <tr>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                  >
                    Deployment ID
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                  >
                    Triggered At
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                  >
                    Endpoint
                  </th>
                  <th
                    scope="col"
                    className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider"
                  >
                    Status
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-700/50">
                {deployments.length > 0 ? (
                  deployments.map((d) => (
                    <tr
                      key={d.id}
                      className="hover:bg-slate-700/50 transition-colors"
                    >
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-mono text-white">
                        #{d.jenkins_build_number || d.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                        {new Date(d.created_at).toLocaleString()}
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
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={d.status} />
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan="4"
                      className="text-center py-10 text-slate-500"
                    >
                      No deployments have been triggered yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        {showDeleteModal && (
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex justify-center items-center z-50">
            <div className="bg-slate-800 p-6 rounded-xl shadow-lg w-full max-w-md border border-slate-700">
              <h2 className="text-xl font-semibold text-white">
                Confirm Deletion
              </h2>
              <p className="text-sm text-slate-400 mt-2">
                Are you sure you want to delete this project? This action cannot
                be undone.
              </p>
              <div className="mt-6 flex justify-end gap-4">
                <Button
                  onClick={() => setShowDeleteModal(false)}
                  variant="outline"
                  className="border-slate-600 bg-slate-700"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleDelete}
                  className="bg-red-600 hover:bg-red-700 text-white"
                >
                  Delete Project
                </Button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
