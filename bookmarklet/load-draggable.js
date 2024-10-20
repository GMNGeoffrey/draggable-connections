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

