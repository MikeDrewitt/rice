#!/usr/bin/env sh

# Terminate already running bar instances
killall -q polybar

polybar laptop &

echo "Bars launched..."
