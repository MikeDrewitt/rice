#!/usr/bin/env sh

# Terminate already running bar instances
  killall -q polybar

# lemonbuddy laptop &
polybar center &
polybar left &
polybar right &

echo "Bars launched..."
