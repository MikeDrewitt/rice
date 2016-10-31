#!/usr/bin/env sh

# Terminate already running bar instances
  killall -q lemonbuddy

# Launch bar1 and bar2
lemonbuddy top &
#lemonbuddy bottom &
# lemonbuddy_wrapper bar2 &

echo "Bars launched..."
