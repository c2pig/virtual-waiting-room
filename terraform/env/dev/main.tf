locals {
  env = "dev"
}

provider "google" {
  credentials = file("~/Downloads/green-torus-318407-e1fcb2f1be44.json")
  project = var.project
  region  = var.region
  zone    = "var.zone"
}

module "function" {
  source      = "../../modules/function"
  project     = var.project
  name        = "waiting-room-func"
  entry_point = "app"
}