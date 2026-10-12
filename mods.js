/**
 * 
 * @param {FileSystemDirectoryHandle} dir 
 * @returns {Promise<boolean>}
 */
async function isMod(dir) {
    try {
        await dir.getFileHandle("lovely.toml")
        return true
    } catch {
        try {
            await dir.getDirectoryHandle("lovely")
            return true
        } catch {
            return false
        }
    }
}

/**
 * 
 * @param {FileSystemDirectoryHandle} dir
 * @returns {Promise<Object>}
 */
async function directoryToObject(dir, isRoot=false, showCompatibleWarning=true) {
    if (isRoot) {
        try {
            await dir.getFileHandle("webcompatible")
        } catch (err) {
            if (showCompatibleWarning) {
                alert("Mod " + dir.name + " may not be web compatible.")
            }
        }
    }
    const object = {}
    for await (const [path, obj] of dir.entries()) {
        if (obj.kind == "directory") {
            object[path] = await directoryToObject(obj)
        } else {
            object[path] = await obj.getFile()
        }
    }
    return object
}

let mods = {}

async function addModDir() {
    /** @type {FileSystemDirectoryHandle} */
    const dir_picker = await showDirectoryPicker({
        mode: "read",
        startIn: "downloads"
    });

    if (await isMod(dir_picker)) {
        mods[dir_picker.name] = await directoryToObject(dir_picker, true)
    } else {
        for await (const [path, obj] of dir_picker.entries()) {
            if (obj.kind == "directory") {
                mods[obj.name] = await directoryToObject(obj, true)
            }
        }
    }
    if (Object.keys(mods).length > 0) {
        $("makeName").placeholder = "Modded"
    }
    renderModsList()
}

function clearMods() {
    mods = {}
    $("makeName").placeholder = "vanilla"
    renderModsList()
}

function removeMod(mod_name) {
    delete mods[mod_name]
    if (Object.keys(mods).length == 0) {
        $("makeName").placeholder = "vanilla"
    }
    renderModsList()
}

function renderModsList() {
    const list = $("mod-list");
    list.innerHTML = "";
    if (Object.keys(mods).length == 0) {
        const empty = document.createElement("span");
        empty.className = "hint";
        empty.innerText = "None. The build will be unmodded.";
        list.appendChild(empty);
        return;
    }
    for (const mod_name of Object.keys(mods)) {
        const row = document.createElement("div");
        row.className = "mod-item";

        const mod_item = document.createElement("label");
        mod_item.innerText = mod_name;


        if (mods["Dump from Lovely"] && mod_name != "Dump from Lovely") {
            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.checked = "dont_patch.txt" in mods[mod_name];
            checkbox.onchange = function() {
                if (checkbox.checked) {
                    mods[mod_name]["dont_patch.txt"] = new File(["true"], "dont_patch.txt", { type: "text/plain" })
                } else {
                    delete mods[mod_name]["dont_patch.txt"]
                }
            }
            mod_item.prepend(checkbox);
            mod_item.title = "Tick if this mod was part of the Lovely dump";
        }

        row.appendChild(mod_item);

        const remove = document.createElement("button");
        remove.innerText = "Remove";
        remove.setAttribute("aria-label", "Remove " + mod_name);
        remove.onclick = () => removeMod(mod_name);
        row.appendChild(remove);

        list.appendChild(row);
    }
}

async function useLovelyDump() {
    // Open a folder picker
    const dir_picker = await showDirectoryPicker({
        mode: "read",
        startIn: "downloads"
    });

    mods["Dump from Lovely"] = await directoryToObject(dir_picker, true, false)

    alert("Tick the checkbox next to each mod that was included in the dump.")

    renderModsList()
}