#!/bin/sh

if which ghead >/dev/null 2>&1; then
  HEAD=ghead
else
  HEAD=head
fi

echo '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">'
echo '    <!-- Material icons are published under Apache License Version 2.0. https://material.io/icons/ -->'
for icon in attachment code open_in_new star lock reply reply_all menu list forward create; do
    wget -q "https://storage.googleapis.com/material-icons/external-assets/v4/icons/svg/ic_${icon}_black_24px.svg" -O - \
        | grep -v fill | $HEAD -n -1 \
        | sed "s/<path/<path id=\"${icon}\"/"
done
echo "</svg>"
