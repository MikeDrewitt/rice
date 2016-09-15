#!/bin/bash
brightness=$(cat "/sys/class/leds/smc::kbd_backlight/brightness")
a=$((brightness+25))

if [ "$brightness" -lt 250 ]
then
echo $a >> /sys/class/leds/smc\:\:kbd_backlight/brightness
fi
