terraform {
  required_providers {
    google = {
      source = "hashicorp/google"
      version = "3.5.0"
    }
  }
  backend "local" {
    path = "/Users/c2pig/terraform.tfstate"
  }
}

provider "google" {
  credentials = file("~/Downloads/green-torus-318407-e1fcb2f1be44.json")

  project = "green-torus-318407"
  region  = "ap-southeast1"
  zone    = "ap-southeast1-c"
}

resource "google_compute_network" "vpc_network" {
  name = "terraform-network"
}
