#!/bin/sh
lock() {
    sh ~/.scripts/lock.sh
}

case "$1" in
    lock)
		lock
        ;;
    logout)
		i3-msg exit 
        ;;
    suspend)
		systemctl suspend && lock
		;;
    hibernate)
		systemctl hibernate && lock
        ;;
    reboot)
        systemctl reboot
        ;;
    shutdown)
        systemctl poweroff
        ;;
    *)
        echo "Usage: $0 {lock|logout|suspend|hibernate|reboot|shutdown}"
        exit 2
esac

exit 0
