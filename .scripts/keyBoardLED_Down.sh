#!/bin/bash
brightness=$(cat "/sys/class/leds/smc::kbd_backlight/brightness")
a=$((brightness-25))

if [ "$brightness" -gt 25 ]
then
echo $a >> /sys/class/leds/smc\:\:kbd_backlight/brightness
fi
