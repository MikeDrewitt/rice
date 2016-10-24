#
# ~/.bash_profile
#

[[ -f ~/.bashrc ]] && . ~/.bashrc

alias ll='ls -l'
alias la='ls -a'
alias lla='ls -la'

alias ..='cd ..'

alias cls='clear'

alias mikasa='ssh mikasa'
alias timberlake='ssh timberlake'
alias cheshire='ssh cheshire'
alias hanji='ssh hanji'
alias yeager='ssh yeager'
alias autograder='ssh autograder'
alias fury='ssh fury'
alias ironman='ssh ironman'
alias hulk='ssh hulk'
alias hawkeye='ssh hawkeye'
alias warmachine='ssh warmachine'
alias jarvis='ssh jarvis'

alias pacman='sudo pacman'
alias reboot='sudo reboot'

alias chrome='google-chrome-unstable'
#alias google-chrome='google-chrome-unstable'

alias school='cd ~/Sync/school && vim +NERDTree'

export PATH=$PATH:/home/michael/.scripts/
