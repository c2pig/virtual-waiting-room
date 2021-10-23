resource "google_vpc_access_connector" "connector" {
  name          = var.name
  ip_cidr_range = var.ip_cidr
  network       = var.network
}
