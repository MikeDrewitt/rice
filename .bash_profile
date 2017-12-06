#
# ~/.bash_profile
#

[[ -f ~/.bashrc ]] && . ~/.bashrc

alias l='ls -l -h'
alias ll='ls -l -h'
alias la='ls -a'
alias lla='ls -la -h'

alias ..='cd ..'

alias cls='clear'
alias cl='clear'

alias mikasa='ssh mikasa'
alias sasha='ssh sasha'
alias levi='ssh levi'
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
alias jarvis-dev='ssh jarvis-dev'
alias armstrong='ssh armstrong'
alias bigdata='ssh bigdata'

alias pacman='sudo pacman'
alias reboot='sudo reboot'

# Git tools
alias gadd='git add'
alias gsta='git status'
alias gcom='git commit -m'
alias greb='git rebase -i'
alias gpul='git pull'
alias gfet='git fetch'
alias gfpull='git fetch && git pull'

alias chrome='google-chrome-unstable'
#alias google-chrome='google-chrome-unstable'

alias school='cd ~/Sync/school && vim +NERDTree'
alias ops='cd ~/Sync/school/421*/vagrant && vagrant ssh'

alias neofetch='neofetch --clean && neofetch --w3m ~/.scripts/current_wallpaper.jpg' 

alias grep='grep --color -E -rIn'

export PATH=$PATH:/home/michael/.scripts/
export GOPATH=~/.go

alias nr='network_restart'

export PATH=/Users/michaeldrewitt/bin/Sencha/Cmd/4.0.5.87:$PATH

export SENCHA_CMD_3_0_0="/Users/michaeldrewitt/bin/Sencha/Cmd/4.0.5.87"
