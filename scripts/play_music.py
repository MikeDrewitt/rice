#!/usr/bin/env python2
# Uses Google Play Desktop Player [Unofficial]'s API for now playing.

import json
from os.path import expanduser

GPMDP_API = expanduser('~') + '/.config/Google Play Music Desktop Player/json_store/playback.json'

def main():
    with open(GPMDP_API, 'r') as f:
        data = json.load(f)
        if data['playing']:
            print('{title} by {artist}'.format(title=data['song']['title'], artist=data['song']['artist']));
        else:
            print('              ')

if __name__ == '__main__':
    main()
