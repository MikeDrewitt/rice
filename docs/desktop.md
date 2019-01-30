# Notes for my Arch Linux desktop

## Issues

### Sleep
Resuming from sleep with the display port on my GPU doesn't work. We can fix this by running 

```bash
sleep 1; xset dpms force off
```
