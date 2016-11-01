#!/usr/bin/env bash
 
ENABLED=$(xset q | sed -n 's/.*DPMS is \(Enabled\).*/\1/p')
 
if [ $ENABLED ]
then
 xset -dpms && xset s off
else
 xset +dpms && xset s on
fi
