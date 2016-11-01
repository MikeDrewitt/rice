#!/bin/bash

scrot /home/michael/.scripts/lock_screen.png

ffmpeg -loglevel quiet -y -i ~/.scripts/lock_screen.png -vf "gblur=sigma=10" ~/.scripts/lock_screen.png

i3lock -nu -i "/home/michael/.scripts/lock_screen.png"


