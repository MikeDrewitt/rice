#!/bin/bash

declare -a software=(
	'google-chrome-dev'
	'atom-editor'
	'gpmdp-git'
	'gpmdp-remote'
	'scudcloud'
	'vlc-git'
	'teamspeak3'
	'rdesktop'
	'rsync'
	'ranger'
	'htop-git'
)

declare -a rice=(
	'xfce4'
	'i3-gaps-git'
	'i3lock-blur'
	'py3status'
	'i3status'
	'rofi-git'
	'dmenu'
	'compton-git'
	'feh'
	'scrot'
	'ttf-font-awesome'
	'vim-promptline-git'
	'vundle-git'
	'vim-nerdtree'
	'playerctl'
)

declare -a desktop=(
	'nvidia'
	'nvidia-libgl'
	'obs-studio-git'
	'ckb-git-latest'
	'lib32-nvidia-libgl'
)

declare -a laptop=(
	'perl-x11-guitest'
	'perl-smart-comments'
	'xf86-input-synapitcs-xswipe-git'
	'bcwc-pcie-dkms'
)

for install in "${software[@]}"
do
	echo $install
	#yaourt -S --noconfirm $install
done

for install in "${rice[@]}"
do
	echo $install
	yaourt -S --noconfirm $install
done

for install in "${laptop[@]}"
do
	echo $install
	yaourt -S --noconfirm $install
done

# pacman -S base-devel qt5-base zlib		# dependancies for k70 RGB
