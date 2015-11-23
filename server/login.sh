#!/bin/bash

username=$1
password=$2


if [ ! -f acc/$1.pass ]; then
	printf 0
else
	PASS=$(cat acc/$1.pass)
	if [ "$PASS" == "$password" ]; then
		printf 1
	else
		printf 0
	fi
fi
	

