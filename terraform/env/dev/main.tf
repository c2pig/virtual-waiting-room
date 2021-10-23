locals {
  env = "dev"
}

provider "google" {
  credentials = "/Users/c2pig/Downloads/green-torus-318407-476eb19a6736.json"
  project = var.project
  region  = var.region
  zone    = "var.zone"
}

module "store" {
  source      = "../../modules/store"
  project     = var.project
  name        = "session-store"
  tier        = "BASIC"
  memory_size = "1"
  region      = var.region
  redis_version     = "REDIS_5_0"
  ip_cidr        = "10.148.0.0/28"
}

module "function" {
  depends_on = [
    module.store,
    module.network
  ]
  source      = "../../modules/function"
  project     = var.project
  name        = "waiting-room-func"
  entry_point = "app"
  store_host  = module.store.host 
  connector_uri = module.network.connector_uri
}

module "network" {
  depends_on = [
    module.store
  ]
  source      = "../../modules/network"
  name        = "cf-vpc-connector"
  ip_cidr        = "10.8.0.0/28"
  network     = "default"
}
