# My Rice
My i3 setup, uses polybar.

# Installing 
Checkout the install list to see what is needed to be installed for all of this
to work correctly. If you're running Arch Linux, you should be able to run
`install_packages.sh rice` to install all the needed dependancies for the
look of the rice. This works by parsing the install\_list, so if you wanted to
you could pick and choose what to install by hand from there. 

# Some Notes
Some of my paths in .scripts are hardcoded to my home path, the best way to find
these would be to grep for michael as using `grep -rIn michael` to find the file
and line numbers of those hardcoded paths. Most of what the dependancies are
used for are commented in the install\_list as well and can be refered to there. 

# Setting Up i3.
This section will go into lite detail how to use my files to setup i3.

	Running/ reading setup.sh will show you the locations of where the files
	belong at least in my setup.

	Much of my rice will not work without all (or most at least) of the rice
	section of the install\_list installed. Using the correct args with
	install_prackages.sh sould install the missing packages needed to make the
	rice work without too much trouble. 

# Other Distros
This does work on other distros, I've helped others with setting this up on
Ubuntu, however I remember it being a chore finding some of the more obscure 
dependancies. This however might no longer be the case as this was done quiet 
some time ago. 

# A Rice Sample
![A sample screenshot](terminal_screenshot.png/?raw=true "Fake Busy")
