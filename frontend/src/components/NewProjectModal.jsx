import { useEffect, useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import axios from "../api/axiosClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader2, GitBranch, Github, ChevronsUpDown } from "lucide-react";

export default function NewProjectModal({ open, onClose, onCreated }) {
  const [repos, setRepos] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedRepo, setSelectedRepo] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [repoSearchQuery, setRepoSearchQuery] = useState("");


  const [isBranchOpen, setIsBranchOpen] = useState(false);
  const branchSelectRef = useRef(null);

  const navigate = useNavigate();

  useEffect(() => {
    if (open) {
      setLoading(true);
      axios
        .get("/github/repos")
        .then((res) => setRepos(res.data))
        .catch(() => setRepos([]))
        .finally(() => setLoading(false));
    }
  }, [open]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (branchSelectRef.current && !branchSelectRef.current.contains(event.target)) {
        setIsBranchOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [branchSelectRef]);

  const filteredRepos = repos.filter((repo) =>
    repo.full_name.toLowerCase().includes(repoSearchQuery.toLowerCase())
  );

  const handleRepoChange = async (repoFullName) => {
    setSelectedRepo(repoFullName);
    setBranches([]);
    setSelectedBranch("");
    if (!repoFullName) return;
    try {
      setLoading(true);
      const [owner, repo] = repoFullName.split("/");
      const res = await axios.get(`/github/repos/${owner}/${repo}/branches`);
      setBranches(res.data);
    } finally {
      setLoading(false);
    }
  };

  const handleCreate = async () => {
    if (!selectedRepo || !selectedBranch) return;
    try {
      setCreating(true);
      const repoData = repos.find((r) => r.full_name === selectedRepo);
      const payload = {
        repo_full_name: selectedRepo,
        branch: selectedBranch,
        repo_url: repoData?.html_url || null,
        description: "Image Diffusion model project",
      };
      const res = await axios.post("/projects/", payload);
      onCreated?.();
      onClose();
      navigate(`/projects/${res.data.id}`);
    } catch (err) {
      console.error(err);
      alert("❌ Failed to create project. Please try again.");
    } finally {
      setCreating(false);
    }
  };

  const handleClose = () => {
    setSelectedRepo("");
    setSelectedBranch("");
    setBranches([]);
    setRepoSearchQuery("");
    setIsBranchOpen(false);
    onClose();
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-lg bg-[#0B0F17] text-gray-200 border border-gray-800 rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-white">
            <Github className="text-emerald-500 w-5 h-5" />
            Create New Project
          </DialogTitle>
          <p className="text-sm text-gray-400 mt-1">
            Select a repository and branch to create a project.
          </p>
        </DialogHeader>

        {loading && !branches.length ? (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin text-emerald-500" size={32} />
          </div>
        ) : (
          <div className="space-y-6 mt-4">
            {/* Repository Selection */}
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">
                Repository
              </label>
              {selectedRepo ? (
                 <div className="flex items-center justify-between p-2.5 bg-[#1f2937] rounded-lg">
                  <span className="text-emerald-400 font-medium">{selectedRepo}</span>
                  <Button
                    variant="ghost" size="sm"
                    onClick={() => { setSelectedRepo(""); setBranches([]); setSelectedBranch(""); setRepoSearchQuery(""); }}
                    className="text-gray-400 hover:text-emerald-400 px-2 py-1 h-auto"
                  >
                    Change
                  </Button>
                </div>
              ) : (
                <>
                  <input
                    type="text" placeholder="Search for a repository..."
                    value={repoSearchQuery} onChange={(e) => setRepoSearchQuery(e.target.value)}
                    className="w-full bg-[#111827] border border-gray-700 rounded-lg p-2 text-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition"
                  />
                  <div className="mt-2 max-h-48 overflow-y-auto border border-gray-700 rounded-lg">
                    {filteredRepos.length > 0 ? (
                      filteredRepos.map((r) => (
                        <div
                          key={r.full_name}
                          onClick={() => { handleRepoChange(r.full_name); setRepoSearchQuery(""); }}
                          className="p-2 text-gray-300 hover:bg-gray-700 cursor-pointer flex items-center gap-2"
                        >
                          <Github className="w-4 h-4 text-gray-500" />
                          {r.full_name}
                        </div>
                      ))
                    ) : (
                      <p className="p-4 text-center text-gray-500">No repositories found.</p>
                    )}
                  </div>
                </>
              )}
            </div>
            
            {selectedRepo && (
              <div className="relative" ref={branchSelectRef}>
                <label className="text-sm font-medium text-gray-400 mb-2 block">Branch</label>
                <button
                  onClick={() => setIsBranchOpen(!isBranchOpen)}
                  disabled={loading}
                  className="w-full flex justify-between items-center bg-[#111827] border border-gray-700 rounded-lg p-2.5 text-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition disabled:opacity-50"
                >
                  {loading ? (
                    <span className="text-gray-500 flex items-center"><Loader2 className="animate-spin mr-2 h-4 w-4" /> Loading...</span>
                  ) : (
                    selectedBranch || <span className="text-gray-500">Select a branch</span>
                  )}
                  <ChevronsUpDown className="w-4 h-4 text-gray-500" />
                </button>

                {isBranchOpen && !loading && (
                  <div className="absolute z-10 top-full mt-2 w-full bg-[#1f2937] border border-gray-700 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {branches.map((b) => (
                      <div
                        key={b}
                        onClick={() => {
                          setSelectedBranch(b);
                          setIsBranchOpen(false);
                        }}
                        className="p-2 text-gray-300 hover:bg-emerald-800/50 cursor-pointer flex items-center gap-2"
                      >
                         <GitBranch className="w-4 h-4 text-gray-500" />
                        {b}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        <DialogFooter className="mt-8 flex justify-end space-x-3 border-t border-gray-800 pt-4">
          <Button
            variant="ghost" onClick={handleClose}
            className="text-gray-400 hover:text-gray-200 hover:bg-gray-800"
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={!selectedRepo || !selectedBranch || creating || loading}
            className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:bg-emerald-900/50 disabled:text-gray-400 disabled:cursor-not-allowed"
          >
            {creating ? (
              <>
                <Loader2 className="animate-spin mr-2 h-4 w-4" /> Creating...
              </>
            ) : (
              "Create Project"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}