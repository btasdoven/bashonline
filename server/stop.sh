#!/bin/bash

INST_NAME=$1

if [ -f $INST_NAME.alias ]; then
	MAC_NAME=$(cat $INST_NAME.alias)
	rm -f $INST_NAME.alias
	sudo lxc-stop -k -n $MAC_NAME
else
	sudo lxc-stop -k -n $INST_NAME	
#	sudo lxc-destroy -n $INST_NAME
fi
