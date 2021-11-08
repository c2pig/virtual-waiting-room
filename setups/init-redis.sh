#!/bin/bash
multipass launch -vvv  --name redis --cpus 2 --mem 2048M --disk 4G --cloud-init cloud-init.yaml
