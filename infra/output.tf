output "cluster_name" {
  value = google_container_cluster.gke.name
}

output "region" {
  value = var.gcp_region
}