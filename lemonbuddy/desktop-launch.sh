#!/usr/bin/env sh

# Terminate already running bar instances
  killall -q lemonbuddy

# lemonbuddy laptop &
lemonbuddy desktop_center &
lemonbuddy desktop_left &
lemonbuddy desktop_right &


echo "Bars launched..."
