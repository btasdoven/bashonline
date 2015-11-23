#!/bin/bash

PORT=$1
STAT=$(netstat -nltp | grep $PORT )
PID=$(echo $STAT | cut -d' ' -f7 | cut -d'/' -f1)

if [ "$PID" != "" ]; then
	kill -9 $PID
fi

dt=$(date '+%Y%m%d_%H%M%S')
mkdir log/$dt
mv log/bo* log/$dt/
sudo python server.py $PORT
