#!/usr/bin/env sh

# Terminate already running bar instances
  killall -q lemonbuddy

# lemonbuddy laptop &
lemonbuddy desktop_main &
lemonbuddy desktop_second &


echo "Bars launched..."
