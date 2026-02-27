variable "gcp_svc_key" {
  type        = string
  description = "Path to GCP service account JSON key"
}

variable "gcp_project" {
  type        = string
  description = "GCP project ID"
}

variable "gcp_region" {
  type        = string
  description = "GCP region for the cluster"
}

variable "cluster_name" {
  type    = string
  default = "mlops-gke"
}

variable "node_count" {
  type    = number
  default = 2
}

variable "machine_type" {
  type    = string
  default = "e2-standard-2"
}