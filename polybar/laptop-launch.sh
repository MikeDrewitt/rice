#!/usr/bin/env sh

# Terminate already running bar instances
killall -q lemonbuddy

lemonbuddy laptop &

echo "Bars launched..."
