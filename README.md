# Draggable NYT Connections

An Extension/Bookmarklet to make the tiles in the NYT Connections game
drag-and-droppable.

## Usage

### Browser Extension

#### Firefox

Available for Desktop and Android:
https://addons.mozilla.org/en-US/firefox/addon/draggable-connections/

#### Chrome

Google requires you to register and pay a (small) fee to publish to their
webstore. It's also not possible to distribute Chrome extensions as files
yourself for platforms other than Linux. Chrome also doesn't support extensions
on mobile, and I'm guessing that's the place people more commonly play. I'll
register and publish this to the store if there's interest (please file an
issue), but not going to bother otherwise. Until then, you can load this as an
unpacked extension. Git clone the repository and follow the
[Chrome documentaiton](https://developer.chrome.com/docs/extensions/get-started/tutorial/hello-world#load-unpacked).
Chrome will complain about the unrecognized
[browser_specific_settings field](https://developer.mozilla.org/en-US/docs/Mozilla/Add-ons/WebExtensions/manifest.json/browser_specific_settings).
This is because Chrome doesn't support this field and
[Mozilla requires it for API upload to AMO](https://extensionworkshop.com/documentation/develop/extensions-and-the-add-on-id/)
🤷

#### Edge

I don't use Edge. I can look into publishing this to the extension store if
there's interest. Edge does appear to support mobile extensions.

#### Opera

I don't use Opera. I can look into publishing this to the extension store if
there's interest, but Opera doesn't support mobile extensions.

#### Safari

Apple charges you $100/year for the honor of publishing for their browser. I
will not be doing that, but someone else is welcome to. I also don't own any
Apple devices, so have no way to test.

### Bookmarklet

If you can't install the extension, another option is a
[Bookmarklet](https://en.wikipedia.org/wiki/Bookmarklet). To create one,
copy-paste the contents of
[bookmarklet/draggable.bookmarklet.encoded.txt](./bookmarklet/draggable.bookmarklet.encoded.txt)
into the URL field of a bookmark in your browser. Then after going to the
connections page (and clicking play), execute the bookmarklet. If you're
concerned about executing obfuscated code from the internet in your browser,
good! Feel free to re-generate the bookmarklet:

1. Run `bookmarklet/create.sh` to concatenate the relevant files into
   [bookmarklet/draggable.bookmarklet.js](./bookmarklet/draggable.bookmarklet.js).
2. Use a tool like https://chriszarate.github.io/bookmarkleter/ to transform it
   into a bookmarklet.
3. Paste that into the URL field of a bookmark in your browser.

#### Mobile

You can use bookmarklets on mobile Firefox and Chrome, but you have to get to
them via the address bar instead of the bookmarks menu. See
https://paul.kinlan.me/use-bookmarklets-on-chrome-on-android/ (Firefox is the
same).

## Compatibility

I have manually tested this in Firefox Desktop (131.0.2), Firefox Android
(131.0.2), Chrome Desktop (129.0.6668.100) and Chrome Android (129.0.6668.100,
bookmarklet only). AFAIK, I haven't used any exotic browser features, so it
should work on any browser but very old browser versions might have issues.

## Background

This is something I've wanted since the very first time I played the game and I
think it's pretty weird that they haven't already implemented it. Recently I've
been going for reverse-rainbow solves, which means you really have to get all 4
categories before you guess any and not being able to reorder is really
annoying, so I whipped up a little script. I was inspired to use
[GSAP](https://gsap.com)'s
[Draggable](https://gsap.com/docs/v3/Plugins/Draggable/) plugin by
[this Reddit post](https://www.reddit.com/r/NYTConnections/comments/19bj5m0/drag_and_drop_connections_tiles/)
where someone shared a standalone page where you can paste in the connections
words and fiddle with them. I don't want to copy-paste things though.

## Developing

Use
[web-ext](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/)
to manage the extension. Run under `npx` unless you've added it to the path,
e.g.:

```shell
npx web-ext lint
```

### WSL

`web-ext run` doesn't work on WSL (https://github.com/wxt-dev/wxt/issues/55).
You have to build the extension and then load it as a temporary add-on. You may
want to first bump the version in the manifest.json to get a new filename.

```shell
npx web-ext build
```

On Firefox on Windows, open a test profile (`about:profiles`) and then got to
`about:debugging` and `Load Temporary Add-on...`. Locate the zip file in the
`web-ext-artifacts/` directory under the extension source directory on the WSL
and load it. If you make a change in the source, rebuild the extension,
overwriting the previous zip file.

```
npx web-ext build --overwrite-dest
```

and then on the `about:debugging` page `Reload` the temporary add-on. You will
also likely need to reload the connections site. I recommend using a private
window and deleting the cookies and local storage under the devtools "Storage"
tab to get a fresh puzzle each time.

### Publish

See the
[Firefox docs](https://extensionworkshop.com/documentation/develop/getting-started-with-web-ext/#sign-and-submit-for-publication)
for details. Most of the configuration is set in
[web-ext-config.mjs](./web-ext-config.mjs). You'll need to include your API key
and secret, either in `~/.web-ext-config.mjs` or on the command line. **Don't
put them in the git repository!** Update
[amo-metadata.json](./amo-metadata.json) `release_notes` and any necessary
`approval_notes` (in particular if you add any new minified dependencies, see
Firefox
[Third Party Library Usage](https://extensionworkshop.com/documentation/publish/third-party-library-usage/))
docs. Then run

```shell
npx web-ext sign
```

#### Bookmarklet

If you made changes to the source code (as opposed to just extension metadata),
rebuild the bookmarklet

```shell
bookmarklet/create.sh
```

(you can also confirm that you didn't make any changes, in which case rerunning
this shouldn't change anything).

## License

This project is licensed under the terms of the MIT license. See
[LICENSE](./LICENSE).
