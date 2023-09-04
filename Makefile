all: content/material-icons.svg

content/material-icons.svg: scripts/get-material-icons.sh
	$< > $@
