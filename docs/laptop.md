# Notes on installing for a 2015 Macbook Pro

## Useful commands

Fix sleep issues
```
echo XHC1 > /proc/acpi/wakeup
```

## Wifi Commands

List networks
```
nmcli device wifi list
```

Connect to network
```
nmcli device wifi connect NETWORK_SSID password SOME_PASSWORD
```
