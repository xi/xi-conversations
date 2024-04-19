#!/bin/sh

echo '<svg viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">'
echo '    <!-- Material icons are published under Apache License Version 2.0. https://material.io/icons/ -->'
for icon in attachment code open_in_new star lock reply reply_all refresh menu list forward create mode_heat; do
    wget -q "https://fonts.gstatic.com/s/i/short-term/release/materialsymbolsoutlined/${icon}/fill1/24px.svg" -O - \
        | grep -o '<path.*/>' \
        | sed "s/<path/    <path id=\"${icon}\"/"
done
echo "</svg>"
