#!/bin/bash

count=0
till=${1:-6}

while [ $count -lt $till ]; do
  curl -s -c cookie-$count.data -o /dev/null -v -L iphone.celcom.com.my/ &
  count=$((count+1))
  sleep 1;
done
