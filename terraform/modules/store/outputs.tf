output "host" {
 description = "The IP address of the instance."
 value = "${google_redis_instance.memorystore_redis_instance.host}"
}
