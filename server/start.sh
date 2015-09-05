#!/bin/bash

function print {
	python -c "import sys;sys.stdout.write(sys.argv[1].decode('unicode-escape'))" "$1"
}

function draw_menu {
	
	# get screen size as COLS and ROWS
	sudo bash /var/lib/lxc/deneme/rootfs/usr/bin/scrsize set 
	IFS=', ' read ROWS COLS <<< $(stty size)

	len=0	
	for arg in "$@"
	do
		len=$((len+3+${#arg}))
	done
	len=$((len-3))
	
	LEFT=$((COLS/2-len/2))
	#10 3 17 3 11 = 44
	#- LOG IN -   - GUEST SESSION -   - SIGN UP -  

	H=\\u2500 #\\u2550 #\\u2501
	V=\\u2502 #\\u2551 #\\u2503
	C1=\\u256D #\\u2554 #\\u250F
	C2=\\u256E #\\u2557 #\\u2513
	C3=\\u2570 #\\u255A #\\u2517
	C4=\\u256F #\\u255D #\\u251B

	print "\n\n\x1b[${LEFT}C"
	for arg in "$@"
	do
		s=$(perl -E "print '$H' x (${#arg}+2)")
		print "\x1b[44m$C1$s$C2\x1b[0m   "
	done
	
	print "\n\x1b[${LEFT}C"
	for arg in "$@"
	do
		s=$(perl -E "print ' ' x (${#arg}+2)")
		print "\x1b[44m$V$s$V\x1b[0m   "
	done
	
	print "\n\x1b[${LEFT}C"
	for arg in "$@"
	do
		print "\x1b[44m$V $arg $V\x1b[0m   "
	done
	
	print "\n\x1b[${LEFT}C"
	for arg in "$@"
	do
		s=$(perl -E "print ' ' x (${#arg}+2)")
		print "\x1b[44m$V$s$V\x1b[0m   "
	done
	
	print "\n\x1b[${LEFT}C"
	for arg in "$@"
	do
		s=$(perl -E "print '$H' x (${#arg}+2)")
		print "\x1b[44m$C3$s$C4\x1b[0m   "
	done	
	
	print "\n\n\x1b[${LEFT}C"
	i=0
	for arg in "$@"
	do
		i=$((i+1))
		s1=$(perl -E "print ' ' x ((${#arg}-1)/2)")
		s2=$(perl -E "print ' ' x (${#arg}/2)")		
		print " $s1($i)$s2    "
	done	
	print "\n\n"
}

function log_in {
	read -p "Username: " username
	read -s -p "Password: " password
	print "\n"	
	
	correct=$(./login.sh $username $password)
	
	while [ "$correct" == "0" ]; 
	do
		sleep 3
		print "\nLogin incorrect\n"		
		read -p "Username: " username
		read -s -p "Password: " password
		print "\n"		
		
		correct=$(./login.sh $username $password)
	done
	
	print "\x1b[H\x1b[J"
	print "\nYou are logged in as $username.\n"
	IFS=$'\r\n' GLOBIGNORE='*' :; machines=($(cat acc/$username.mac))

	draw_menu ${machines[*]}
	
	print "\n\nHere are your machines. Select one of them: "
	
	while true
	do
		read machine
		
		re='^[0-9]+$'
		if ! [[ $machine =~ $re ]] ; then
		   print "\nIncorrect machine number. Select one of them: "
		   continue
		fi
		
		machine=$((machine-1))
		if [ "x${machines[machine]}" != "x" ]; then
			echo ${machines[machine]} > $INST_NAME.alias
			print "${machines[machine]} is initializing..."
			sudo lxc-start -c $TTY_SLAVE -n ${machines[machine]}
			break			
		else
			print "\nIncorrect machine number. Select one of them: "
		fi
	done
}

function guest_session {
	print "A machine is being created...\n"			
	sudo lxc-clone -H -o deneme -n $INST_NAME
	sudo sed -i s/deneme/$INST_NAME/ /var/lib/lxc/$INST_NAME/fstab
	print "Machine is initializing...\n"	
	sudo lxc-start -c $TTY_SLAVE -n $INST_NAME
}



TTY_SLAVE=$1
INST_NAME=$2


draw_menu "LOG IN" "GUEST SESSION" "SIGN UP" 
	
while true
do
	read -p "Select one of the above choices by typing 1, 2 or 3: " choice
	
	if [ "$choice" == "3" ]; then
		print "We do not currently accept new registrations. Still, you can use Guest Session.\n"
	elif [ "$choice" == "1" ] || [ "$choice" == "2" ]; then
		break
	fi
done

if [ "$choice" == "1" ]; then
	log_in
elif [ "$choice" == "2" ]; then
	guest_session
fi




