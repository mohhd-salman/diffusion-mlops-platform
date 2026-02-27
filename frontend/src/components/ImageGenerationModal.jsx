import { useState, useEffect, useRef } from "react";
import axios from "../api/axiosClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Loader2,
  Sparkles,
  ChevronsUpDown,
  Box,
  Calendar,
  Link as LinkIcon,
  AlertCircle,
} from "lucide-react";

export default function ImageGenerationModal({ isOpen, onClose, deployments }) {
  const successfulDeployments = deployments.filter((d) => d.status === "succeeded");

  const [selectedDepId, setSelectedDepId] = useState("");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);

  const [imageBase64, setImageBase64] = useState(null);
  const [error, setError] = useState(null);

  const [isModelOpen, setIsModelOpen] = useState(false);
  const modelSelectRef = useRef(null);

  useEffect(() => {
    if (isOpen && successfulDeployments.length > 0) {
      setSelectedDepId(successfulDeployments[0].id);
      setPrompt("");
      setImageBase64(null);
      setError(null);
    }
    if (isOpen && successfulDeployments.length === 0) {
      setSelectedDepId("");
      setPrompt("");
      setImageBase64(null);
      setError(null);
    }
  }, [isOpen, deployments]);

  useEffect(() => {
    function handleClickOutside(event) {
      if (modelSelectRef.current && !modelSelectRef.current.contains(event.target)) {
        setIsModelOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleGenerate = async () => {
    if (!selectedDepId || !prompt) return;

    setLoading(true);
    setImageBase64(null);
    setError(null);

    try {
      const res = await axios.post(`/images/generate/${selectedDepId}`, {
        prompt,
      });

      if (!res.data?.image_base64) {
        throw new Error("Backend did not return image_base64");
      }

      setImageBase64(res.data.image_base64);
    } catch (err) {
      console.error("Generation failed", err);
      setError(
        err.response?.data?.detail ||
          err.response?.data?.message ||
          err.message ||
          "Failed to generate image."
      );
    } finally {
      setLoading(false);
    }
  };

  const selectedDeployment = successfulDeployments.find((d) => d.id === selectedDepId);

  const dataUrl = imageBase64 ? `data:image/png;base64,${imageBase64}` : null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-5xl bg-[#0B0F17] text-gray-200 border border-gray-800 rounded-2xl shadow-2xl overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-xl font-semibold text-white">
            <Sparkles className="text-emerald-600 w-5 h-5" />
            Model Playground
          </DialogTitle>
          <p className="text-sm text-gray-400 mt-1">
            Select a model version and enter a prompt to generate images.
          </p>
        </DialogHeader>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mt-4">
          {/* LEFT COLUMN */}
          <div className="lg:col-span-1 space-y-6">
            {/* Model Dropdown */}
            <div className="relative" ref={modelSelectRef}>
              <label className="text-sm font-medium text-gray-400 mb-2 block">
                Select Model Endpoint
              </label>

              {successfulDeployments.length > 0 ? (
                <>
                  <button
                    onClick={() => setIsModelOpen(!isModelOpen)}
                    disabled={loading}
                    className="w-full flex justify-between items-center bg-[#111827] border border-gray-700 rounded-lg p-2.5 text-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition disabled:opacity-50"
                  >
                    <span className="truncate">
                      {selectedDeployment
                        ? `Dep #${selectedDeployment.id} - ${selectedDeployment.endpoint_url || "No URL"}`
                        : "Select a model"}
                    </span>
                    <ChevronsUpDown className="w-4 h-4 text-gray-500 flex-shrink-0" />
                  </button>

                  {isModelOpen && !loading && (
                    <div className="absolute z-10 top-full mt-2 w-full bg-[#1f2937] border border-gray-700 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                      {successfulDeployments.map((d) => (
                        <div
                          key={d.id}
                          onClick={() => {
                            setSelectedDepId(d.id);
                            setIsModelOpen(false);
                          }}
                          className="p-2.5 text-sm text-gray-300 hover:bg-gray-700 cursor-pointer flex flex-col border-b border-gray-700/50 last:border-0"
                        >
                          <span className="font-medium text-emerald-400">
                            Deployment #{d.id}
                          </span>
                          <span className="text-xs text-gray-500 truncate" title={d.endpoint_url}>
                            {d.endpoint_url || "No Endpoint URL"}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <div className="flex items-center gap-2 text-yellow-400 text-sm bg-yellow-400/10 p-3 rounded border border-yellow-400/20">
                  <AlertCircle className="w-4 h-4" />
                  No active models found.
                </div>
              )}
            </div>

            {/* Prompt */}
            <div>
              <label className="text-sm font-medium text-gray-400 mb-2 block">
                Prompt
              </label>
              <textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                placeholder="A futuristic city at sunset..."
                className="w-full h-40 bg-[#111827] border border-gray-700 rounded-lg p-3 text-gray-200 focus:ring-2 focus:ring-emerald-500 focus:outline-none transition resize-none"
              />
            </div>

            {/* Generate */}
            <Button
              onClick={handleGenerate}
              disabled={loading || !selectedDepId || !prompt}
              className="w-full py-6 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold disabled:bg-emerald-900/50 disabled:text-gray-400 disabled:cursor-not-allowed shadow-lg shadow-emerald-900/20"
            >
              {loading ? (
                <>
                  <Loader2 className="animate-spin mr-2 h-5 w-5" /> Generating...
                </>
              ) : (
                "Generate Image"
              )}
            </Button>
          </div>

          <div className="lg:col-span-2 bg-[#111827]/50 rounded-xl border border-gray-800 flex items-center justify-center relative min-h-[400px]">
            {loading && (
              <div className="text-center">
                <Loader2 className="w-12 h-12 animate-spin text-emerald-500 mx-auto mb-4" />
                <p className="text-gray-400 animate-pulse">Processing on GPU...</p>
              </div>
            )}

            {!loading && error && (
              <div className="text-center p-6 bg-red-900/10 border border-red-500/30 rounded-xl max-w-sm animate-in fade-in zoom-in duration-300">
                <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
                <h3 className="text-red-400 font-semibold mb-2">Generation Failed</h3>
                <p className="text-sm text-red-200/70">{error}</p>
              </div>
            )}

            {!loading && !dataUrl && !error && (
              <div className="text-center text-gray-600">
                <Sparkles className="w-16 h-16 mx-auto mb-4 opacity-20" />
                <p>Select a model and enter a prompt to start.</p>
              </div>
            )}

            {!loading && dataUrl && (
              <div className="w-full h-full p-6 flex flex-col items-center animate-in fade-in zoom-in duration-300">
                <div className="relative group w-full max-w-md mb-6">
                  <img
                    src={dataUrl}
                    alt="Generated"
                    className="rounded-lg shadow-2xl w-full border border-gray-700"
                  />
                  <a
                    href={dataUrl}
                    download="generated_image.png"
                    className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white font-bold rounded-lg backdrop-blur-sm"
                  >
                    Download Image <LinkIcon className="ml-2 w-4 h-4" />
                  </a>
                </div>

                <div className="w-full max-w-md bg-[#1f2937] p-4 rounded-lg border border-gray-700 text-sm space-y-2 shadow-lg">
                  <div className="flex justify-between border-b border-gray-700 pb-2 mb-2">
                    <span className="text-gray-400 font-semibold">Generation Details</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-gray-400 flex items-center gap-2">
                      <Box className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-gray-200">Dep #{selectedDepId}</span>
                    </div>
                    <div className="text-gray-400 flex items-center gap-2">
                      <Calendar className="w-3.5 h-3.5 text-emerald-500" />
                      <span className="text-gray-200">
                        {new Date().toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                  <div className="pt-2">
                    <div className="text-xs text-gray-500 font-mono truncate bg-[#111827] p-2 rounded border border-gray-700/50">
                      {selectedDeployment?.endpoint_url || ""}
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}