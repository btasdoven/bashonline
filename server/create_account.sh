#!/bin/bash
function print {
        python -c "import sys;sys.stdout.write(sys.argv[1].decode('unicode-escape'))" "$1"
}

print "\nA wise attempt. Thanks!\n"
print "\nAfter creating an account, you will have permanent machines with sudo access.\n"
print "You will be able to install any program on them and use them as you wish.\n"
print "But first, we need some information about you.\n\n"

read -p "Please Enter Your Username: " -e username

while [ -f acc/$username.pass ]; do
	print "This username is already taken.\n"
	read -p "Enter Another Username: " -e username
done

print "\n"
read -s -p "Enter Your Password: " password
print "\n"
read -s -p "Re-enter Your Password: " password2

while [ "$password" != "$password2" ]; do
	print "\nPasswords you have entered do not match. Enter again.\n"
	read -s -p "Enter Your Password: " password
	print "\n"
	read -s -p "Re-enter Your Password: " password2
done

print "\n\n"
read -p "Please Enter Your E-mail Address For Verification: " -e email
print "$email" > acc/$username.email

print "\nUser $username is successfully created.\n\n"
print "$password" > acc/$username.pass

print "Creating a new machine for you... It may take a while..."
MACNAME="$username-mac"
sudo lxc-clone -H -o ubuntu-mac -n $MACNAME > /dev/null
sudo sed -i s/ubuntu-mac/$MACNAME/ /var/lib/lxc/$MACNAME/fstab
sudo sed -i s/root/$username/ /var/lib/lxc/$MACNAME/rootfs/etc/init/console.conf

sudo chroot /var/lib/lxc/$MACNAME/rootfs useradd --create-home -s /bin/bash $username
sudo echo "$username:$password" | sudo chroot /var/lib/lxc/$MACNAME/rootfs chpasswd
sudo chroot /var/lib/lxc/$MACNAME/rootfs adduser $username sudo
mkdir /var/lib/lxc/$MACNAME/rootfs/shared/all
sudo chroot /var/lib/lxc/$MACNAME/rootfs ln -s /shared /home/$username/shared

print "$MACNAME" > acc/$username.mac
print "\nDone.\n"
print "\nCongratulations! You can now log in with your account.\n"


