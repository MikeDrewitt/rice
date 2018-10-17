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
alias gcp='git cherry-pick'
alias gad='git add'
alias gst='git status'
alias gcm='git commit -m'
alias grb='git rebase -i'
alias gpl='git pull'
alias gft='git fetch'
alias gck='git checkout'
alias gfap='git fetch && git pull'
alias gcre='git commit -m "a" && git rebase -i HEAD~2'
alias gadcre='git add . && git commit -m "a" && git rebase -i HEAD~2'
alias gdd='git diff develop'
alias gfix='git commit --amend'
alias glog='git log --graph --full-history --all --color --pretty=tformat:"%x1b[31m%h%x09%x1b[32m%d%x1b[0m%x20%s%x20%x1b[33m(%an)%x1b[0m" --oneline'
alias gnew='git push --force --set-upstream origin'

# $1 - parent branch
# $2 - chile branch
# $3 - SHA of child
gupdate() {
	sha=$(git rev-parse HEAD)
	currentBranch=$(git branch | sed -n -e 's/^\* \(.*\)/\1/p')

	# Make sure shared is on the correct branch
	# cd shared/
	# git checkout $currentBranch
	# ..

	git checkout "$1"
	git branch -D $currentBranch
	git checkout -b $currentBranch
	git cherry-pick $sha
}

# Sencha Builds
alias sencha_android_go='sencha app build native && cd cordova && cordova run --device android --debug'

alias chrome='google-chrome-unstable'
#alias google-chrome='google-chrome-unstable'

alias school='cd ~/Sync/school && vim +NERDTree'
alias ops='cd ~/Sync/school/421*/vagrant && vagrant ssh'

alias neofetch='neofetch --clean && neofetch --w3m ~/.scripts/current_wallpaper.jpg' 

alias grp='grep --color -E -rIn'
alias fnd='function fnd() { find $1 -iname $2 -print } fnd'

# Easy access Vim
alias notes='vim ~/notes.md'
alias vimrc='vim ~/.vimrc'


export PATH=$PATH:/home/michael/.scripts/
export GOPATH=~/.go

alias nr='network_restart'

