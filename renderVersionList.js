function $(id) {
    return document.getElementById(id)
}

const make = document.createElement.bind(document)

/** Highlight the row of the currently loaded version (if any). */
function highlightLoadedVersion() {
    for (const tr of $("versionsList").children) {
        const is_loaded = typeof loaded_game_id !== "undefined" && tr.dataset.version === loaded_game_id
        tr.classList.toggle("loaded-row", is_loaded)
        if (is_loaded) {
            tr.setAttribute("aria-current", "true")
        } else {
            tr.removeAttribute("aria-current")
        }
    }
}

/**
 * Re-render the table of cached versions.
 */
async function renderVersionList() {
    const versions = await listCachedVersions()
    const versionsList = $("versionsList")
    versionsList.innerHTML = ""
    {
        const load_vanilla_radio = $("loadVanillaRadio")
        const has_vanilla = versions.indexOf("vanilla") != -1
        load_vanilla_radio.disabled = !has_vanilla
        $("vanillaHint").hidden = has_vanilla
        if (!has_vanilla && load_vanilla_radio.checked) {
            // Don't leave a now-impossible option selected.
            $("loadExeRadio").checked = true
            $("loadExeRadio").dispatchEvent(new Event("change"))
        }
    }

    if (versions.length == 0) {
        const tr = make("tr")
        const td = make("td")
        td.colSpan = 2
        td.className = "empty"
        td.innerText = "No versions yet. Build one above to get started."
        tr.appendChild(td)
        versionsList.appendChild(tr)
        return
    }

    for (const version of versions) {
        const tr = make("tr")
        tr.dataset.version = version

        const name = make("td")
        name.innerText = version
        tr.appendChild(name)

        const buttons = make("td")

        const loadButton = make("button")
        loadButton.onclick = guarded(async function() {
            await loadVersion(version)
        })
        loadButton.innerText = "Load"
        loadButton.setAttribute("aria-label", "Load " + version)
        buttons.appendChild(loadButton)

        const delButton = make("button")
        delButton.innerText = "Delete"
        delButton.className = "danger"
        delButton.setAttribute("aria-label", "Delete " + version)
        delButton.onclick = guarded(async function() {
            if (confirm("Delete '" + version + "'?")) {
                await deleteCachedGame(version)
                if (version === loaded_game_id) {
                    await loadVersion(null)
                }
                await renderVersionList()
            }
        })
        buttons.appendChild(delButton)

        tr.appendChild(buttons)

        versionsList.appendChild(tr)
    }
    highlightLoadedVersion()
}
