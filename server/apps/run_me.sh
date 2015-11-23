#!/bin/bash

echo "Hello, this script is here just to kindly ask you for a feedback."
read -p "I wonder if you like the site or not (Y/N): " -e answer
thumbs=""
while [ "$thumbs" == "" ]
do
	if [[ $answer =~ ^[Yy]$ ]]; then
		thumbs="up"
	elif [[ $answer =~ ^[Nn]$ ]]; then
		thumbs="down" 
	else
		thumbs=""
	fi
	
	read -p "Just type Y for yes or N for no: " -e answer
done

curl --request POST 'http://tasdoven.ceng.metu.edu.tr/listen80/thumbs.php' --data "thumbs=$thumbs"
