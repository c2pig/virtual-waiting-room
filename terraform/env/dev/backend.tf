terraform {
  required_providers {
    google = {
      source = "hashicorp/google"
      version = "3.5.0"
    }
  }
  backend "gcs" {
    credentials = "~/Downloads/green-torus-318407-e1fcb2f1be44.json"
    bucket = "waiting-room-tfstate"
    prefix = "env/development"
  }
}