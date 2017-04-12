#!/usr/bin/python
'''
This will esentially move everything into their proper places for the setup to be complete.

ie: move .rice to ~/.rice etc.

Something to keep in mind is that some of the paths needed to be hardcoded.
Easiest way to find those are probably by using a grep -r to find all the /home/michael/
'''

import os 
import sys
import subprocess

DOT_DIRS = ['.scripts', '.i3', '.fonts', '.atom', '.config']
DOT_FILES = ['.bash_profile', '.bashrc', '.vimrc', '.xmodmaprc', '.Xresources', '.zshrc']

for dirs in DOT_DIRS:
    subprocess.call(['cp -r ' + dirs + ' ~/'], shell=True)
    print('copied ' + dirs)

for files in DOT_FILES:
    subprocess.call(['cp ' + files + ' ~/'], shell=True)
    print('copied ' + files)
