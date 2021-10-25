resource "google_redis_instance" "memorystore_redis_instance" {
  name           = var.name
  tier           = var.tier
  memory_size_gb = var.memory_size
  region         = var.region
  project        = var.project
  redis_version  = var.redis_version
}
