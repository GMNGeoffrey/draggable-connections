# Draggable NYT Connections

An Extension/Bookmarklet to make the tiles in the NYT Connections game
drag-and-droppable.

## Usage

### Bookmarklet

To create a [Bookmarklet](https://en.wikipedia.org/wiki/Bookmarklet) copy-paste
the contents of
[bookmarklet/draggable.bookmarklet.encoded.txt](./bookmarklet/draggable.bookmarklet.encoded.txt)
into the URL field of a bookmark in your browser. If you're concerned about
executing obfuscated code from the internet in your browser, good! Feel free to
re-generate the bookmarklet:

1. Run `./create_bookmarklet.sh` to concatenate the relevant files into
   [bookmarklet/draggable.bookmarklet.js](./bookmarklet/draggable.bookmarklet.js).
2. Use a tool like https://chriszarate.github.io/bookmarkleter/ to transform it
   into a bookmarklet.
3. Paste that into the URL field of a bookmark in your browser.

#### Mobile

You can actually use bookmarklets on mobile Firefox and Chrome, but you have to
get to them via the address bar instead of the bookmarks menu. See
https://paul.kinlan.me/use-bookmarklets-on-chrome-on-android/ (Firefox is the
same).

### Browser Extension

I have yet to package this as an installable extension from one of the extension
web stores. In the meantime, you can load it as a temporary extension, though
the bookmarklet options is probably easier.

#### Desktop Firefox

You can load this as a temporary developer extension. Git clone the repository
and follow the
[Firefox documentation](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/Your_first_WebExtension#installing).


#### Android Firefox

Requires packaging. If you want to do development you can sideload it following
the
[Firefox extension development documentation](https://extensionworkshop.com/documentation/develop/developing-extensions-for-firefox-for-android/#install-and-run-your-extension-in-firefox-for-android)

#### Chrome

You can load this as an unpacked extension. Git clone the repository and follow
the
[Chrome documentaiton](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).
I seem to have only used cross-browser extension features, so this seems to just
work.

## Compatibility

I have manually tested this in Firefox, Firefox Android, and Chrome. AFAIK, I
haven't used any exotic browser features, but very old browsers might have
issues.

## Background

This is something I've wanted since the very first time I played the game and I
think it's pretty weird that they haven't already implemented it. Recently I've
been going for reverse-rainbow solves, which means you really have to get all 4
categories before you guess any and not being able to reorder is really
annoying, so I whipped up a little script. I was inspired to use
[GSAP](https://gsap.com)'s
[Draggable](https://gsap.com/docs/v3/Plugins/Draggable/) plugin by
[this Reddit post](https://www.reddit.com/r/NYTConnections/comments/19bj5m0/drag_and_drop_connections_tiles/)
that creates a standalone page where you can paste in the connections words and
fiddle with them.


## License

This project is licensed under the terms of the MIT license. See
[LICENSE](./LICENSE).
