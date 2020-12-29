set nocompatible                            " use vim defaults instead of vi
set encoding=utf-8                          " always encode in utf
set runtimepath+=~/.vim/bundle/Vundle.vim   " vundle path

set expandtab tabstop=2                     " tabs for spaces & 2 spaces per tab
set number                                  " display linenumber
set mouse=a                                 " allows cursor support

" Vundle Setup
call vundle#begin()
  Plugin 'gmarik/Vundle.vim'						    " Plugin managers that makes the magic happen

  " Utility
  Plugin 'vim-airline/vim-airline'    			" status bar
  Plugin 'neoclide/coc.nvim'                " auto-completion tool
  Plugin 'scrooloose/nerdtree'					    " sidebar filetree
  Plugin 'tmsvg/pear-tree'                  " autoclosing
  
  " Customization
  Plugin 'vim-airline/vim-airline-themes'		" themes for status bar 
  Plugin 'rafi/awesome-vim-colorschemes'    " colorschemes

  " Language Support
  Plugin 'leafgarland/typescript-vim'
  Plugin 'pangloss/vim-javascript'
  Plugin 'peitalin/vim-jsx-typescript'
  Plugin 'styled-components/vim-styled-components', { 'branch': 'main' }
call vundle#end()

" Theme Setup
syntax on                                   " turns on syntax highlighting
colorscheme minimalist                      " sets color scheme
let g:airline_theme='ayu_mirage'            " sets airline theme 
