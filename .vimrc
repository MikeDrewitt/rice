" ~/.vimrc		-> linux $VIM/.vimrc	-> win
"
" Archivo de configuración del editor VIM (er mejo!)
"
" Trato que funcione tanto en WIN (con gvim) como en LINUX (vim y gvim)
" Configuración ontenida de W0ng -> https://github.com/w0ng
"
" Vicente Gimeno Morales - E7 Version 2.8 - 16 sep 2015
"======================================================================#
" -----------------------------------------------------------------------------
"
set nocompatible		" use vim defaults instead of vi
set encoding=utf-8		" always encode in utf

" Vim Plugins {{{
" -----------------------------------------------------------------------------
"
" Brief help
" :PluginList			- lists configured plugins
" :PluginInstall		- installs plugins
" :PluginUpdate			- Update Plugins
" :PluginSearch foo		- searches for foo; append `!` to refresh local cache
" :PluginClean			- confirms removal of unused plugins
"
" see :h vundle for more details or wiki for FAQ

set runtimepath+=~/.vim/bundle/Vundle.vim
call vundle#begin()
	
	Plugin 'gmarik/Vundle.vim'						" Plugin managers that makes the magic happen

	Plugin 'Shougo/unite.vim'						" Find files and buffers using ag
	Plugin 'Shougo/vimfiler.vim'					" File Explorer :VimFiler
	Plugin 'jlanzarotta/bufexplorer'				" Buffer Explorer :BufExplore
	Plugin 'godlygeek/tabular'						" Text alignment
	Plugin 'scrooloose/syntastic'					" Syntax checking on write
	Plugin 'tpope/vim-fugitive'						" Git wrapper
	Plugin 'nathanaelkane/vim-indent-guides.git'	" Show tab/space guides
	Plugin 'fweep/vim-tabber'						" Control tabs better
	Plugin 'qpkorr/vim-bufkill'						" Better vim buffers ie: BD
	Plugin 'airblade/vim-gitgutter'					" Git highlighting differences
	Plugin 'kien/ctrlp.vim'							" Fuzzy Search

	Plugin 'bling/vim-airline'						" Pretty statusbar
	Plugin 'vim-airline/vim-airline-themes'			" Themes for the pretty status bar

	" Languages
	Plugin 'pangloss/vim-javascript'
	Plugin 'mxw/vim-jsx'

	Plugin 'jiangmiao/auto-pairs'					" Closes brackets, parens, etc
	Plugin 'scrooloose/nerdtree'					" If you have to ask, you're not ready
	Plugin 'PotatoesMaster/i3-vim-syntax'			" i3 coloring

	" Colosrscheme coordinator
	Plugin 'dylanaraps/wal'

	" Colorschemes
	Plugin 'marciomazza/vim-brogrammer-theme'		" Pastel colors on a dark background, too yellow
	Plugin 'davidklsn/vim-sialoquent'				" Greyish Yellow Matted
	Plugin 'tyrannicaltoucan/vim-quantum'			" Darker grey and green
	Plugin 'arcticicestudio/nord-vim'				" Light grey and blue
	Plugin 'antlypls/vim-colors-codeschool'			" Subdued grey and ugly green, and nice colors
	Plugin 'KeitaNakamura/neodark.vim'				" Like atoms one dark
	Plugin 'rakr/vim-two-firewatch'					" Firewatch theme
	Plugin 'mkarmona/materialbox'					" MaterialBox
	Plugin 'ayu-theme/ayu-vim' 						" ayu

	" Airline Themes
	Plugin 'dikiaap/minimalist'

" Put your non-Plugin stuff after this line
call vundle#end()


" NERDTree Stuffs
autocmd VimEnter * NERDTree
let g:NERDTreeWinPos = "left"

if has("win32")
	set runtimepath+=~/.vim
endif

" -------------------------------------- Settings --------------------------------------

" File detection
filetype on
filetype plugin indent on
syntax on

" General
set backspace=2						" enable <BS> for everything
set colorcolumn=120					" visual indicator of column
set number							" Show line numbers
set completeopt=longest,menuone		" Autocompletion options
set complete=.,w,b,u,t,i,d			" autocomplete options (:help 'complete')
set hidden							" hide when switching buffers, don't unload
set laststatus=2					" always show status line
set lazyredraw						" don't update screen when executing macros
set mouse=a							" enable mouse in all modes
set noshowmode						" don't show mode, since I'm already using airline
set nowrap							" disable word wrap
set showbreak="+++ "				" String to show with wrap lines
set number							" show line numbers
set showcmd							" show command on last line of screen
set showmatch						" show bracket matches
set spelllang=es					" spell
set spellfile=~/.vim/spell/es.utf-8.add
set textwidth=0						" don't break lines after some maximum width
set ttyfast							" increase chars sent to screen for redrawing
set ttyscroll=3					" limit lines to scroll to speed up display
set title							" use filename in window title
set wildmenu						" enhanced cmd line completion
set wildchar=<TAB>					" key for line completion
set noerrorbells					" no error sound
set splitright						" Split new buffer at right
set scrolloff=20					" Keeps you 20 lines form the bottom. Let's you see more

" Folding
set foldlevelstart=99				" no folds closed on open
set foldmethod=marker				" collapse code using markers
set foldnestmax=1					" limit max folds for indent and syntax methods

" Tabs
set autoindent						" copy indent from previous line
set noexpandtab						" no replace tabs with spaces
set shiftwidth=4					" spaces for autoindenting
set smarttab						" <BS> removes shiftwidth worth of spaces
set softtabstop=0 noexpandtab		" spaces for editing, e.g. <Tab> or <BS>
set tabstop=4						" spaces for <Tab>
set expandtab						" Tabs will be converted to spaces

" Searches
set hlsearch						" highlight search results
set incsearch						" search whilst typing
set ignorecase						" case insensitive searching
set smartcase						" override ignorecase if upper case typed
set more							" Stop in list

" Status bar -> Replace with vim-airplane plugin
set laststatus=2					" show ever
set showmode						" show mode
set showcmd							" show cmd
set ruler							" show cursor line number
set shm=atI							" cut large messages

syntax enable

let &t_8f="\<Esc>[38;2;%lu;%lu;%lum"
let &t_8b="\<Esc>[48;2;%lu;%lu;%lum"
set termguicolors

colorscheme ayu

let g:airline_theme='ayu' 			" if you have Airline installed and want the associated theme
let g:Powerline_symbols='fancy'

set guifont=Droid\ Sans\ Mono\ for\ Powerline:15
set encoding=utf-8
set termencoding=utf-8

" --------------------------------------- Mappings -------------------------------------

" Fixes linux console keys

imap jk <ESC> 

map <ESC>10j <C-j>
map <ESC>10k <C-k>

" Map leader
let mapleader = ','

" Toggle hlsearh for results
nnoremap <leader><leader> :nohlsearch<CR>
" Increment on cursor in new line
nnoremap <leader>a	qaYp<C-A>q1@a
" Open buff explorer
nnoremap <leader>b :BufExplorer<CR>
" Open diff vertical
nnoremap <leader>d :vertical diffsplit<CR>
" Open file browser
nnoremap <leader>f :Explore<CR>

" Editor Controls
noremap <A-up> :call feedkeys( line('.')==1 ? '' : 'ddkP' )<CR>
noremap <A-down> ddp

" Buffer selection
nnoremap <leader>n :bn<CR>
nnoremap <leader>p :bp<CR>
nnoremap <leader><Tab> :b#<CR>
nnoremap <C-Tab> :bn<CR>
nnoremap <C-S-Tab> :bp<CR>
nnoremap <C-Right> :bn<CR>
nnoremap <C-Left> :bp<CR>
nnoremap <M-Right> :bn<CR>
nnoremap <M-Left> :bp<CR>
nnoremap <M-n> :bn<CR>
nnoremap <M-p> :bp<CR>

" Next window
nnoremap <tab> <C-W>w
" Togle fold
nnoremap <space> za
" Search command history
cnoremap <C-p> <Up>
cnoremap <C-n> <Down>
" Repace (:help substitute) (:help regular)
nnoremap <C-R> :%s///gic

" Paste mode for terminal
nnoremap <F2> :set invpaste paste?<CR>
set pastetoggle=<F2>

nnoremap <F3> gg=G<CR>

autocmd InsertEnter * :set number
autocmd InsertLeave * :set relativenumber

" HOME
iab _home ~/

" -----------------------------------------------------------------------------
"  vim-airline
let g:airline_inactive_collapse = 0
let g:airline#extensions#tabline#enabled = 1
let g:airline#extensions#tagbar#enabled = 1
if has("gui_win32") || &term == "gnome-terminal"
	let g:airline_powerline_fonts = 0
	let g:airline_symbols = {}
	let g:airline_left_sep = ''
	let g:airline_left_sep = ''
	let g:airline_right_sep = ''
	let g:airline_right_sep = ''
	let g:airline_theme = 'minimalist'
else
	let g:airline_powerline_fonts = 1
	let g:airline_theme = 'minimalist'
endif

" Syntastic
let g:syntastic_html_tidy_ignore_errors = [
    \  '<html> attribute "lang" lacks value',
    \  '<a> attribute "href" lacks value',
	\  '<a> propietary attribute ',
    \  'trimming empty <span>',
    \  'trimming empty <h1>'
    \ ]

" Omnicompletion
autocmd FileType css setlocal omnifunc=csscomplete#CompleteCSS
autocmd FileType html,markdown,xhtml setlocal omnifunc=htmlcomplete#CompleteTags
autocmd FileType javascript setlocal omnifunc=javascriptcomplete#CompleteJS
autocmd FileType python setlocal omnifunc=python3complete#Complete
autocmd FileType xml setlocal omnifunc=xmlcomplete#CompleteTags

" Indent rules, Linux Kernel Coding Style
autocmd FileType c
	\ setlocal noexpandtab tabstop=4 shiftwidth=4 softtabstop=4
	"\ list lcs=tab:+¿
autocmd FileType cpp,java,php,python
	\ setlocal expandtab tabstop=4 shiftwidth=4 softtabstop=4
	\ list lcs=tab:+.
autocmd FileType markdown setlocal textwidth=120
autocmd FileType prg
	\ setlocal noexpandtab tabstop=2 shiftwidth=2 softtabstop=2 cindent
	\ list lcs=tab:+.

" Txt
autocmd FileType text setlocal textwidth=120 wrap

" Folding rules
autocmd FileType c,cpp,java,prg setlocal foldmethod=syntax foldnestmax=5
autocmd FileType css,html,htmldjango,xhtml,javascript,json,markdown,controller,tpl,component
	\ setlocal foldmethod=indent foldnestmax=20 expandtab tabstop=2 shiftwidth=2 softtabstop=2
	\ list lcs=tab:+.

" Set correct markdown extensions
autocmd BufNewFile,BufRead *.markdown,*.md,*.mdown,*.mkd,*.mkdn
	\ if &ft =~# '^\%(conf\|modula2\)$' |
	\	set ft=markdown |
	\ else |
	\	setf markdown |
	\ endif

" Set filetype for prg
autocmd BufNewFile,BufRead *.prg,*.dev,*.act,*.cas set ft=prg

" vim: set noexpandtab tabstop=4 shiftwidth=4 softtabstop=4:
