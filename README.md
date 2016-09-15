# My Rice
My custom i3 setup.

Something to note is that I've got this running i3 through XFCE to allow for
easier configuration of certain settings. While this rice will work running just
i3, the logout funciton will not. Your milage may also varry in regards to
compton, and rofi as well.

# Installing 
Checkout the install list to see what is needed to be installed for all of this
to work correctly. If you're running Arch Linux, you should be able to run
installAll.sh to install all the needed dependancies.

Anything in /bin/ can be moved into /bin/ in your directory structure. If you
don't want to do it this way, link it from your .i3/config

# Some Notes
A few of my scripts that are calls from either .i3/config, or other scripts are
hard coded paths to those scripts. If you copy some stuff in and it doesn't seem
to be working then checking the script for /home/michael/ would be a good idea
to check there first.

# i3 in XFCE
Though this is not required to make the setup work, I like to use i3 in XFCE for
a few reasons. The largest reason is to have the ability to change small
settings on the fly, stuff like what happens when the lid closes, trackpad
settings, keyboard settings, etc. In my experiance it also helps deal with
screen tearing a little bit nicer than vanilla i3, espetially when running
compton.

To make this happen:
	
	1) Open the XFCE Settings Manager and select Session and Startup.
	2) Switch to the Application Autostart tab and click +Add	
	3) Name: i3wm Description: i3 Command: i3, save and make sure it's checked.
	4) Switch to the Session tab.
	5) Set all 'XFCE options' restart settings to NEVER, EXCEPT xfsettingsd. Note that what I
	mean by XFCE options is things that say in their name "XFCE".
	6) Save Session, and restart your machine. It should then log right into i3. 

# Setting Up i3.
This section will go into lite detail how to use my files to setup i3.

	Everything cloned from the repo should be put into your home directory to
	work properly. That is all except for bin/. I put the contents of this
	directory in my /bin/ so I can call all of the scripts from any path without
	needing a path.

	Everything else, as I said should go into your home directory. I feel like
	most reading this will know but it should be said, many of these files are
	'dot files' which means they are hidden to the user by default. To see them
	in a file brower try Control-h, to see them in terminal use ls -a.

	Once the files are in your home directroy be sure to have all of the
	required installs already installed otherwise things will not be working
	properlly. This means that everything under the Rice section of the install
	list should be installed. The first time loading these files you should
	either restart, or logout and log back in. Any changes after can be shown by
	reloading your i3 file. By default in my config to reload it the keyboard
	command is WindowsKey+Shift+r


# Other Distros
I'm sure these will work with other distros setup with i3. But as for installing

everything you need, you'd be on your own.

# A Rice Sample
![Alt text](terminalScreenshot.png/?raw=true "Fake Busy")
