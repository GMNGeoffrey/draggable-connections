// Taken from https://stackoverflow.com/a/61511955
function waitForElement(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                observer.disconnect();
                resolve(document.querySelector(selector));
            }
        });

        // If you get "parameter 1 is not of type 'Node'" error, see
        // https://stackoverflow.com/a/77855838/492336
        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
}


// Wait for the page to load before setting up the draggables. `setUpDraggables`
// is defined in another file. We don't bother importing dependencies and such:
// the necessary script will be loaded as another content_script.
window.addEventListener('load', waitForElement("fieldset").then(setUpDraggables));
