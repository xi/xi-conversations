This is a minimal clone of [thunderbird-conversations][1].  While contributing
to that project I found that I did not understand a lot of things. I used this
repo as a notepad whenever I found out how something works.

As a consequence, this project is **not meant to be used in production**. That
is not to say that it would not work. But I do not recommend it.

# Differences to thunderbird-conversations

-	I ignored most edge-cases to keep the code straight-forward.
-	No preview.
-	No quickreply.
-	The conversation view is not automatically updated when new messages come in.
-	The conversation view is only triggered when you open a message in a new tab.

# Things I learned while working on this

-	Many thunderbird APIs have next to no documentation. But reading the code is
	not that bad and it is easily searchable with [DXR][2].
-	thunderbird-conversations is a [bootstrapped extension][3] This is deprecated
	and will be replaced by [web extensions][4] in the long run, at least in
	firefox.
-	Plugging into enigmail is hard.
-	protz did an amazing job handling all those edge cases and making it work for
	humans..

# Install

If you feel adventurous and actually want to try this out, you will need to do the following steps:

-	Install node with npm, node-sass and browserify.
-	Run `make`.
-	Link the repository to `$PROFILE/extensions/conversations@xi`.
-	Restart thunderbird.

[1]: https://github.com/protz/thunderbird-conversations
[2]: https://dxr.mozilla.org/comm-central
[3]: https://developer.mozilla.org/en-US/Add-ons/Bootstrapped_extensions
[4]: https://developer.mozilla.org/en-US/Add-ons/WebExtensions
