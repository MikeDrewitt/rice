#!/bin/bash

image_path="/home/michael/.scripts/lock.png"

scrot $image_path

convert $image_path -scale 25% $image_path
ffmpeg -loglevel quiet -y -i $image_path -vf "gblur=sigma=10" $image_path
convert $image_path -scale 400% $image_path

i3lock -nu -i $image_path


