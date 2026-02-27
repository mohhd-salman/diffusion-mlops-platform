terraform {
  required_version = ">= 1.5.0"
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0.0"
    }
  }
}

# GKE cluster (Standard)
resource "google_container_cluster" "gke" {
  name     = var.cluster_name
  location = var.gcp_region

  # We will create our own node pool
  remove_default_node_pool = true
  initial_node_count       = 1

  deletion_protection = false
}

# CPU node pool
resource "google_container_node_pool" "cpu_pool" {
  name       = "cpu-pool"
  location   = var.gcp_region
  cluster    = google_container_cluster.gke.name
  node_count = var.node_count

  node_config {
    machine_type = var.machine_type
    disk_size_gb = 30
    disk_type    = "pd-balanced"

    oauth_scopes = [
      "https://www.googleapis.com/auth/cloud-platform"
    ]
  }
}


# resource "google_container_node_pool" "gpu_pool" {
#   name       = "gpu-pool"
#   location   = var.gcp_region
#   cluster    = google_container_cluster.gke.name
#   node_count = 1

#   node_config {
#     machine_type = "n1-standard-4" # Required for T4 GPUs
#     disk_size_gb = 50              # Diffusion models need more disk space

#     guest_accelerator {
#       type  = "nvidia-tesla-t4"
#       count = 1
#     }

#     # IMPORTANT: Required to allow the GPU drivers to function
#     oauth_scopes = [
#       "https://www.googleapis.com/auth/cloud-platform"
#     ]

#     # Use Spot instances to save ~70% of your $300 credit
#     spot = true

#     metadata = {
#       install-nvidia-driver = "True"
#       disable-legacy-endpoints = "true"
#     }
#   }
# }
