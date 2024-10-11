function setUpDraggables() {
  console.log("DRAGGABLE CONNECTIONS: setup called");
  // Only using selectors that aren't obfuscated
  const outerContainer = document.querySelector("fieldset");
  const tiles = outerContainer.querySelectorAll('[data-testid="card-label"]');
  const tileContainer = tiles[0].parentNode;
  const deselectBtn = document.querySelector('[data-testid="deselect-btn"]');
  const submitBtn = document.querySelector('[data-testid="submit-btn"]');

  // Unhelpfully, after a category is solved, all the remaining tiles get
  // reordered. So we store the current order when submit is pressed and if a
  // new solved category is added (and presumably everything else is reordered),
  // we add the nodes back in that order.
  let solvedNodes = outerContainer.querySelectorAll('[data-testid="solved-category-container"]');
  let solvedCount = solvedNodes.length;
  let tilesSnapshot = Array.from(tiles);

  // NYT is using CSS transitions for some styles, which interact horribly with GSAP:
  // (https://gsap.com/resources/mistakes/#using-css-transitions-and-gsap-on-the-same-properties).
  // This was still workable on desktop, but on mobile it made it totally unusable.
  // See https://gsap.com/community/forums/topic/42669-poor-draggable-performance-on-mobile-android-firefox-and-chrome/
  for (const tile of tiles) {
    tile.style["transition"] = "none";
  }

  let solvedCategoriesContainer = outerContainer;
  if (solvedCount != 0) {
    solvedCategoriesContainer = solvedNodes[0].parentNode;
  }
  const callback = (mutationList, observer) => {
    let solvedChanged = false;
    for (const mutation of mutationList) {
      if (mutation.type === "childList") {
        solvedNodes = outerContainer.querySelectorAll('[data-testid="solved-category-container"]');
        if (solvedNodes.length != solvedCount) {
          solvedCount = solvedNodes.length;
          solvedChanged = true;
        }
      }
    }
    if (solvedChanged) {
      // Limit the scope we have to observe.
      solvedCategoriesContainer = solvedNodes[0].parentNode;
      for (const tile of tilesSnapshot) {
        // Re-insert each node at the end in turn. The nodes from the new solved
        // category will no longer have a parent and are skipped.
        if (tile.parentNode != null) {
          tileContainer.insertBefore(tile, null);
        }
      }
      // The observer will be reconnected when the submit button is next clicked.
      observer.disconnect();
    }
  };

  const observer = new MutationObserver(callback);

  submitBtn.addEventListener("click", () => {
    tilesSnapshot = Array.from(outerContainer.querySelectorAll('[data-testid="card-label"]'));
    // We could just observe all the time, but it seems better to not have the
    // observer running during all the dragging around. Before anything is
    // solved, we have to observe the whole outer container because the parent
    // element for the solved nodes is only created once the first category is
    // solved. Unfortunately, if the user gets it wrong, the observer won't get
    // disconnected again as we don't have anything to hook into.
    observer.observe(solvedCategoriesContainer, { childList: true, subtree: true });
  });

  function onDrag() {
    if (this.hitTest(tileContainer, 0)) {
      for (const otherTile of tiles) {
        if (this.hitTest(otherTile, "50%")) {
          const direction = this.getDirection(otherTile);
          let referenceElement = otherTile;
          if (direction.includes("right")) {
            referenceElement = referenceElement.nextSibling;
          }
          tileContainer.insertBefore(this.target, referenceElement);
          // Keep the dragged element sticky to the pointer. Otherwise it keeps
          // its x,y coordinates, which are relevant to its position in the DOM,
          // which we just changed.
          this.update(/*applyBounds=*/false, /*sticky=*/true);
          break;
        }
      }
    }
  }

  function onDragEnd() {
    // The element has already been moved in the DOM by onDrag. This just
    // returns it to its new origin.
    gsap.to(this.target, { x: 0, y: 0 });
    // Unselect everything. I couldn't figure out how to interrupt whatever
    // event listener the page is using to select things, so this is the best we
    // can do. Note that this needs to be in `onDragEnd` not `onRelease` or you
    // could never select anything.
    deselectBtn.click();
  }

  Draggable.create(tiles, {
    onDrag,
    onDragEnd,
    // Increase minimumMovement a bit above the default (2), so we don't trigger
    // the deselect everything behavior that follows a drag when someone moves
    // the mouse slightly while clicking.
    minimumMovement: 6
  });
}

// This is only if you use this by loading it directly into the page, e.g. via
// the dev console or as a bookmarklet. For the extension, we specify the
// dependencies in content_scripts.


function loadError(oError) {
    throw new URIError(`The script ${oError.target.src} didn't load correctly.`);
}

function maybeLoadScript(url, onloadFunction) {
    if (document.head.querySelector(`script[src="${url}"]`)) {
        console.log(`Draggable Connections: Script element with ${url} already exists. Aborting.`);
        return;
    }
    const newScript = document.createElement("script");
    newScript.onerror = loadError;
    if (onloadFunction) {
        newScript.onload = onloadFunction;
    }
    document.head.appendChild(newScript);
    newScript.src = url;
}

maybeLoadScript("https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/gsap.min.js", () => {
    console.log("Draggable Connections: gsap loaded");
    maybeLoadScript("https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/Draggable.min.js", () => {
        console.log("Draggable Connections: Draggable loaded");
        gsap.registerPlugin(Draggable);
        setUpDraggables();
    });
});

