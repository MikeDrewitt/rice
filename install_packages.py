#!/usr/bin/python
'''
This program will read from the install_list.txt

It installs everything there so long as the section is called 
as a parameter in at the time of calling this script.

ex: python setup.py programs rice desktop
'''

import os 
import sys
import subprocess

INSTALL_LIST = 'install_list'

aur_packages = os.popen('pacman -Q').read()
aur_packages = aur_packages.split()

# kinda gross because the aur installed packages list also has 
# the versions but for our purposes it won't matter, and goes unsceen anyways

if len(sys.argv) < 2:
    print('This script does nothing without params.')

with open(INSTALL_LIST, 'r') as install_list:
    for install in install_list:
        if install[0] == '/':
            pass
        if install[0] == '#':
            flag = install[1:].strip() 
        else:
            try:
                program = install.split()[0]
                #print(program)
                if not program in aur_packages and flag in sys.argv:
                    subprocess.call(['pacaur -S --noconfirm --noedit ' + program], shell=True)
                    #print(program)
                elif program in aur_packages:
                    print(program + ' is already installed')
            except IndexError:
                pass
     
