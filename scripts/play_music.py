#!/usr/bin/python
import os

playing_dir = '~/.config/Google\ Play\ Music\ Desktop\ Player/json_store/'
playing_file = 'playback.json'

os.system('cd ' + playing_dir)

with open(playing_file, 'r') as db:
    for song in db:
        print(song)




