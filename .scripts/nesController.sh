#!/bash/bin
xboxdrv --evdev /dev/input/event$1 \
	--evdev-absmap ABS_X=x1,ABS_Y=y1,ABS_Z=x2,ABS_RZ=y2,ABS_HAT0X=dpad_x,ABS_HAT0Y=dpad_y \
	--evdev-keymap BTN_SOUTH=a,BTN_EAST=b,BTN_NORTH=x,BTN_WEST=y,BTN_START=start,BTN_SELECT=back,BTN_TL=lt,BTN_TR=rt,BTN_TL2=lb,BTN_TR2=rb,BTN_THUMBL=tl,BTN_THUMBR=tr \
	--axismap -Y1=Y1,-Y2=Y2 \
	--mimic-xpad
