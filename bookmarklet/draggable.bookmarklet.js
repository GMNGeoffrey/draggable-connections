"use strict";

// Capture and replay normal selection events. We don't want dragging to cause a
// tile to be selected, so we capture and stop propagation on the pointer events
// and then if there isn't a drag, we replay them. We do it this way as opposed
// to something like calling the selection function or mimicing its behavior
// because we're trying to hack on top of someone else's obfuscated code, so
// we're trying to stay as close to the user-level as possible.
function onPress(pointerEvent) {
  if (pointerEvent.type != 'pointerdown') {
    console.warn(`onPress got event of unexpected type ${pointerEvent.type}`);
    return;
  }
  // The captured event is just for whatever hooks the NYT React app. We want to
  // let it propagate and not capture it or do anything ourselves.
  if (pointerEvent.captured) return;
  this.last_pd = pointerEvent;
  pointerEvent.stopPropagation();
  // the scale change mimics the native behavior. "50% 50%" is the default
  // transformOrigin, but this somehow gets messed up for some tiles after
  // submission and restoring their order.
  // TODO: figure out why transformOrigin is getting messed up here.
  gsap.to(this.target, {
    opacity: 0.5, duration: 0, scale: 0.9, transformOrigin: "50% 50%"
  });
}

function onRelease(pointerEvent) {
  if (pointerEvent.type != 'pointerup') {
    console.warn(`onRelease got event of unexpected type ${pointerEvent.type}`);
    return;
  }
  // The captured event is just for whatever hooks the NYT React app. We want to
  // let it propagate and not capture it or do anything ourselves.
  if (pointerEvent.captured) return;
  this.last_pu = pointerEvent;
  pointerEvent.stopPropagation();
}

function onClick(pointerEvent) {
  // This checks avoids infinite recursion as pointerup+pointerdown creates
  // another click.
  if (this.last_pd != null) {
    // We have to create a new event because the previous one has the
    // 'cancelled' property set on it and that can't be unset.
    const newPD = new PointerEvent('pointerdown', this.last_pd);
    // We attach a flag to the event to indicate that its one we're replaying to
    // avoid infinite recursion.
    newPD.captured = true;
    this.last_pd = null;
    this.target.dispatchEvent(newPD);
  }
  if (this.last_pu != null) {
    const newPU = new PointerEvent('pointerup', this.last_pu);
    newPU.captured = true;
    this.last_pu = null;
    this.target.dispatchEvent(newPU);
  }
  // Clear all the properties we may have set elsewhere. We want the state when
  // nothing is being dragged to be clean. The documentation claims that
  // onDragEnd always fires, but this is empirically not the case for just a
  // click, so we need to do the adjustement here.
  gsap.to(this.target, { clearProps: "scale,transformOrigin,opacity,zIndex", duration: 0 });
}

function onDragStart() {
  gsap.to(this.target, { zIndex: 1000, duration: 0 });
}

function onDrag(tileContainer, tiles) {
  if (this.hitTest(tileContainer, 0)) {
    for (const otherTile of tiles) {
      if (this.hitTest(otherTile, "50%")) {
        // Note that hitTest already excludes the element itself.
        const direction = this.getDirection(otherTile);
        let referenceElement = otherTile;
        if (direction.includes("right")) {
          referenceElement = referenceElement.nextSibling;
        }
        tileContainer.insertBefore(this.target, referenceElement);
        // Keep the dragged element sticky to the pointer. Otherwise it keeps
        // its x,y coordinates, which are relative to its position in the DOM,
        // which we just changed.
        this.update(/*applyBounds=*/false, /*sticky=*/true);
        break;
      }
    }
  }
}

function onDragEnd() {
  // Basically this is just so very small movements don't take the default half
  // a second, especially since we want to do things after they complete. Even
  // if the tile is very far away we don't want it to take forever to return
  // (this is about the game not the animations), so still capped at 0.5s.
  const distance = Math.sqrt(this.endX ** 2 + this.endY ** 2);
  const rect = this.target.getBoundingClientRect();
  const tileSize = Math.sqrt(rect.height * rect.width);
  const duration = Math.min(0.5, distance / tileSize);

  // The element has already been moved in the DOM by onDrag (if necessary).
  // Return it to the origin and set its properties back to normal.
  let tl = gsap.timeline();
  tl.to(this.target, { x: 0, y: 0, scale: 1, opacity: 1, duration: duration });
  // Clear all the properties we may have set elsewhere. We want the state when
  // nothing is being dragged to be clean.
  tl.to(this.target, { clearProps: "scale,transformOrigin,opacity,zIndex", duration: 0 });
}

function killExistingDraggables(tiles) {
  // Mostly only relevant for development when the extension gets reloaded a
  // lot, but make sure we don't have competing Draggables on an object.
  let existingDraggableCount = 0;
  for (const tile of tiles) {
    const maybeDraggable = Draggable.get(tile);
    if (maybeDraggable) {
      maybeDraggable.kill();
      existingDraggableCount++;
    }
  }
  if (existingDraggableCount !== 0) {
    console.log(`DRAGGABLE CONNECTIONS: killed ${existingDraggableCount} existing draggables on tiles`);
  }
}

function setUpDraggables() {
  console.log("DRAGGABLE CONNECTIONS: setup called");
  gsap.registerPlugin(Draggable);
  gsap.registerPlugin(Flip);
  // Only using selectors that aren't obfuscated. We could use class name
  // prefixes as well as those seem to be consistent.
  const outerContainer = document.querySelector("fieldset");
  let tiles = Array.from(outerContainer.querySelectorAll('[data-testid="card-label"]'));
  const tileContainer = tiles[0].parentNode;
  const submitBtn = document.querySelector('[data-testid="submit-btn"]');

  // Unhelpfully, after a category is solved, all the remaining tiles get
  // reordered. So we store the current order when submit is pressed and if a
  // new solved category is added (and presumably everything else is reordered),
  // we add the nodes back in the saved order.
  let solvedNodes = outerContainer.querySelectorAll('[data-testid="solved-category-container"]');
  let solvedCount = solvedNodes.length;
  let tilesSnapshot = tiles;

  // NYT is using CSS transitions, which interact horribly with GSAP:
  // (https://gsap.com/resources/mistakes/#using-css-transitions-and-gsap-on-the-same-properties).
  // This wasn't perceptible on desktop, but on mobile it made it totally
  // unusable. See
  // https://gsap.com/community/forums/topic/42669-poor-draggable-performance-on-mobile-android-firefox-and-chrome/
  for (const tile of tiles) {
    tile.style["transition"] = "none";
  }

  let solvedCategoriesContainer = outerContainer;
  if (solvedCount != 0) {
    solvedCategoriesContainer = solvedNodes[0].parentNode;
  }
  const observer = new MutationObserver((mutationList, observer) => {
    let solvedChanged = false;
    for (const mutation of mutationList) {
      if (mutation.type === "childList") {
        solvedNodes = solvedCategoriesContainer.querySelectorAll('[data-testid="solved-category-container"]');
        if (solvedNodes.length != solvedCount) {
          solvedCount = solvedNodes.length;
          solvedChanged = true;
        }
      }
    }
    if (solvedChanged) {
      // Limit the scope we have to observe from now on.
      solvedCategoriesContainer = solvedNodes[0].parentNode;
      tilesSnapshot = tilesSnapshot.filter((e) => e.parentNode != null);
      tiles = tiles.filter((e) => e.parentNode != null);
      // Animate the tiles back to the order the user dragged them to.
      const beforeState = Flip.getState(tiles);
      tileContainer.replaceChildren(...tilesSnapshot);
      Flip.from(beforeState);
      // The observer will be reconnected when the submit button is next clicked.
      observer.disconnect();
    }
  });


  submitBtn.addEventListener("click", () => {
    // Something about the tiles being reordered confuses the native app's
    // animation that pulls the guessed tiles up to the top in the case of a
    // correct guess. The tiles frequently move to the wrong position, unrelated
    // stuff gets shuffled, or a tile jumps off of the game area. I tried some
    // options to fix that, like setting the tile order back to the original
    // order here. That avoids the issues with the animations, but it's a bit
    // jarring and trying to animate them back to those positions doesn't work
    // well because the animations are on top of each other. I think that's
    // going to have to just be an unfortunate side-effect of using the
    // extension. Still worth it for the usability, but a bit less pretty.

    tilesSnapshot = Array.from(outerContainer.querySelectorAll('[data-testid="card-label"]'));
    // We could just observe all the time, but it seems better to not have the
    // observer running during all the dragging around. Before anything is
    // solved, we have to observe the whole outer container because the parent
    // element for the solved nodes is only created once the first category is
    // solved. Unfortunately, if the user gets it wrong, the observer won't get
    // disconnected again as we don't have anything to hook into.
    observer.observe(solvedCategoriesContainer, { childList: true, subtree: true });
  });


  killExistingDraggables(tiles);

  Draggable.create(tiles, {
    onDragStart,
    onDrag,
    onDragParams: [tileContainer, tiles],
    onDragEnd,
    onPress,
    onRelease, // Note that this is called before onClick or onDragEnd
    onClick,
    // Increase minimumMovement a bit above the default (2), so slipping while
    // clicking doesn't fail to register.
    minimumMovement: 6,
    // Don't automatically add to the zindex every time a tile is dragged. If
    // this is left as the default true, the tiles eventually end up "on top of"
    // things like the stats window. Not what we want. We instead manually
    // increase and then revert zindex and drag start and end.
    zIndexBoost: false
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
        maybeLoadScript("https://cdn.jsdelivr.net/npm/gsap@3.12.5/dist/Flip.min.js", () => {
            console.log("Draggable Connections: Flip loaded");
            gsap.registerPlugin(Flip);
            setUpDraggables();
        });
    });
});

