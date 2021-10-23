terraform {
  required_providers {
    google = {
      source = "hashicorp/google"
      version = "3.89.0"
    }
  }
  backend "gcs" {
    credentials = "/Users/c2pig/Downloads/green-torus-318407-476eb19a6736.json"
    bucket = "waiting-room-tfstate"
    prefix = "env/development"
  }
}