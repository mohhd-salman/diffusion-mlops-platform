import { Routes, Route } from "react-router-dom";
import Login from "./pages/Login";
import Projects from "./pages/Projects";
import ProtectedRoute from "./components/ProtectedRoute";
import Layout from "./components/Layout";
import Deployments from "./pages/Deployments";
import ProjectDetailPage from "./pages/ProjectDetailPage";
// import GalleryPage from "./pages/GalleryPage";


export default function App() {
  return (
    <Routes>
      {/* Public Route */}
      <Route path="/" element={<Login />} />

      {/* Protected Routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Layout />
          </ProtectedRoute>
        }
      >
        <Route path="/projects" element={<Projects />} />
        <Route path="/deployments" element={<Deployments />} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />
        {/* <Route path="/gallery" element={<GalleryPage />} /> */}
      </Route>
    </Routes>
  );
}
