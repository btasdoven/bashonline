#!/bin/bash

INST_NAME=$1

if [ -f alias/$INST_NAME.alias ]; then
	MAC_NAME=$(cat alias/$INST_NAME.alias)
	rm -f alias/$INST_NAME.alias
	sudo lxc-stop -k -n $MAC_NAME
else
	sudo lxc-stop -k -n $INST_NAME	
	sudo lxc-destroy -n $INST_NAME
fi
