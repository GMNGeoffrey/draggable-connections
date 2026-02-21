# Testing Guide for Order Preservation Fix

## Automated Test Results

The fix has been verified using an automated test that simulates NYT Connections behavior:

### Test Scenario
1. **Initial state**: 16 tiles in custom order (user drags tiles around)
2. **First category solve**: 
   - Site removes first 4 tiles and shuffles remaining 12
   - Extension should restore user's original order for those 12 tiles
   - ✅ **PASSED**: Order correctly preserved
   
3. **Second category solve** (critical test):
   - Site removes next 4 tiles and shuffles remaining 8
   - Extension should restore user's original order for those 8 tiles
   - ✅ **PASSED**: Order correctly preserved

The key fix ensures that the MutationObserver's target container reference is updated before reattaching, preventing stale DOM references after the first category is solved.

## Manual Testing on NYT Connections

### Prerequisites
- Firefox or Chrome browser
- The extension installed (from web-ext-artifacts/draggable_connections-0.7.zip)

### Testing Steps

1. **Install the Extension**
   ```bash
   # Firefox
   - Open Firefox
   - Go to about:debugging
   - Click "This Firefox" → "Load Temporary Add-on"
   - Select the .zip file from web-ext-artifacts/

   # Chrome
   - Extract the .zip file
   - Go to chrome://extensions/
   - Enable "Developer mode"
   - Click "Load unpacked"
   - Select the extracted folder
   ```

2. **Navigate to NYT Connections**
   - Go to https://www.nytimes.com/games/connections
   - Click "Play" to start today's puzzle

3. **Test Order Preservation**
   
   **First Category Test:**
   - Drag tiles to create a custom order (move several tiles around)
   - Take note of the order you created
   - Select 4 tiles and click "Submit"
   - If correct, observe the animation
   - **Expected**: Remaining tiles should be in YOUR custom order, not shuffled

   **Second Category Test** (the critical one):
   - Again, drag remaining tiles to create a new custom order
   - Take note of this order
   - Select 4 more tiles and click "Submit"
   - If correct, observe the animation
   - **Expected**: Remaining tiles should be in YOUR custom order, not shuffled

4. **Success Criteria**
   - ✅ Tiles remain draggable throughout the game
   - ✅ After solving category 1, tiles preserve your order
   - ✅ After solving category 2, tiles preserve your order
   - ✅ After solving category 3, tiles preserve your order
   - ✅ No console errors

### Known Behavior

- The site's animation may still look a bit wonky when gathering solved tiles (this is expected per the code comments)
- The order restoration happens quickly via a Flip animation
- If you make an incorrect guess, the observer remains attached (by design)

## Technical Details

### The Bug
After the first category was solved, the `solvedCategoriesContainer` variable was set to the parent of solved nodes. However, on subsequent submits, this reference could become stale after DOM mutations. The observer would then watch the wrong element or an invalid reference.

### The Fix
Before reattaching the observer on each submit click, we now:
1. Re-query all solved category containers
2. Update `solvedCategoriesContainer` to the current parent element
3. Then attach the observer to the fresh reference

This ensures the observer always watches the correct, current parent of solved categories.

### Code Change
```javascript
submitBtn.addEventListener("click", () => {
  tilesSnapshot = Array.from(outerContainer.querySelectorAll('[data-testid="card-label"]'));
  
  // NEW: Update solvedCategoriesContainer to ensure we have the current parent element
  solvedNodes = outerContainer.querySelectorAll('[data-testid="solved-category-container"]');
  if (solvedNodes.length > 0) {
    solvedCategoriesContainer = solvedNodes[0].parentNode;
  }
  
  observer.observe(solvedCategoriesContainer, { childList: true, subtree: true });
});
```
