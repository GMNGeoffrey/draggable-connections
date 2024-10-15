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
  if (pointerEvent.captured) return;
  this.last_pu = pointerEvent;
  pointerEvent.stopPropagation();
  // Reset what we set in the pointerdown event. I tried to use clearProps here,
  // but that also clears x&y so the tile instantly snaps back to its starting
  // location, which we don't really want.
  gsap.to(this.target, { duration: 0, opacity: 1, scale: 1 });
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
}

function onDragStart() {
  gsap.to(this.target, { zIndex: 1000, duration: 0 });
}

function onDrag(tileContainer, tiles) {
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
        // its x,y coordinates, which are relative to its position in the DOM,
        // which we just changed.
        this.update(/*applyBounds=*/false, /*sticky=*/true);
        break;
      }
    }
  }
}

function onDragEnd() {
  // The element has already been moved in the DOM by onDrag (if necessary).
  // This just returns it to its new origin.
  let tl = gsap.timeline();
  tl.to(this.target, { x: 0, y: 0, duration: 0.5 });
  tl.to(this.target, { clearProps: "zIndex", duration: 0 });
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
  // Only using selectors that aren't obfuscated. We could use class name
  // prefixes as well as those seem to be consistent.
  const outerContainer = document.querySelector("fieldset");
  const tiles = outerContainer.querySelectorAll('[data-testid="card-label"]');
  const tileContainer = tiles[0].parentNode;
  const submitBtn = document.querySelector('[data-testid="submit-btn"]');

  // Unhelpfully, after a category is solved, all the remaining tiles get
  // reordered. So we store the current order when submit is pressed and if a
  // new solved category is added (and presumably everything else is reordered),
  // we add the nodes back in the saved order.
  let solvedNodes = outerContainer.querySelectorAll('[data-testid="solved-category-container"]');
  let solvedCount = solvedNodes.length;
  let tilesSnapshot = Array.from(tiles);

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
  });


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


  killExistingDraggables(tiles);

  Draggable.create(tiles, {
    onDragStart,
    onDrag,
    onDragParams: [tileContainer, tiles],
    onDragEnd,
    onPress,
    onRelease,
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

