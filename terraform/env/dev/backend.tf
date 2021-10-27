terraform {
  required_providers {
    google = {
      source = "hashicorp/google"
      version = "3.89.0"
    }
  }
  backend "gcs" {
    credentials = "__REPLACE_IT_WITH_CREDENTIAL_FILE__"
    bucket = "waiting-room-tfstate"
    prefix = "env/development"
  }
}