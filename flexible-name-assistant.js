/*!
 * Flexible Name Assistant
 * Version: 1.2.1
 * Author: Frederic Pearl
 * License: Custom License - Flexible Name Assistant Module License v1.0
 *
 * This script dynamically assigns names to tokens in Foundry VTT based on customizable categories.
 * Includes an optional toggle for preserving command titles.
 */

// Hook into Foundry when the game is ready
Hooks.on("ready", () => {
    console.log("Flexible Name Assistant module loaded. Version: 1.2.1");

    // Add a button to the Token HUD for easy access
    Hooks.on("renderTokenHUD", (app, html, data) => {
        const button = $(`<div class="control-icon" title="Assign Names">
            <i class="fas fa-edit"></i>
        </div>`);
        button.click(() => {
            // Call the script when the button is clicked
            assignNamesFromApi();
        });
        html.find(".col.right").append(button);
    });
});

// Fetches categories and data from the hosted JSON file
async function fetchCategoriesAndData() {
    const filePath = "https://fpearl.github.io/flexible-name-assistant/data/names.json"; // Hosted JSON URL
    try {
        // Fetch the JSON data
        const response = await fetch(filePath);
        if (!response.ok) throw new Error(`Failed to load configuration file: ${response.statusText}`);
        const data = await response.json();

        if (!data.categories || Object.keys(data.categories).length === 0) {
            throw new Error("No categories found in the configuration file.");
        }

        return data.categories;
    } catch (error) {
        console.error("Error loading categories and data from JSON file:", error);
        ui.notifications.error("An error occurred while fetching categories. Check the console for details.");
        return null;
    }
}

function getRandomName(names, usedNames) {
    const availableNames = names.filter(name => !usedNames.has(name));
    if (availableNames.length) {
        const randomIndex = Math.floor(Math.random() * availableNames.length);
        return availableNames[randomIndex];
    } else {
        console.warn("Ran out of unique names. Reusing from the original list.");
        const randomIndex = Math.floor(Math.random() * names.length);
        return names[randomIndex];
    }
}

async function assignNamesFromApi() {
    const categories = await fetchCategoriesAndData();
    if (!categories) return; // Abort if no categories were loaded

    // Build the dialog content dynamically based on categories
    let content = `
        <p>Select a naming category and toggle title preservation:</p>
        <form>
            <div class="form-group">
                <label for="name-category">Name Category</label>
                <select id="name-category" name="category">
                    ${Object.keys(categories).map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="title-preservation">Preserve Titles</label>
                <input type="checkbox" id="title-preservation" name="preserveTitles" checked />
            </div>
        </form>
    `;

    // Render the dialog
    new Dialog({
        title: "Flexible Name Assignment",
        content: content,
        buttons: {
            confirm: {
                label: "Assign Names",
                callback: async (html) => {
                    const selectedCategory = html.find("#name-category").val();
                    const preserveTitles = html.find("#title-preservation").is(":checked");

                    if (!categories[selectedCategory]) {
                        ui.notifications.warn(`No data found for the selected category: ${selectedCategory}.`);
                        return;
                    }

                    const data = categories[selectedCategory];
                    const names = [...data.names];
                    const titles = data.titles || [];
                    const usedNames = new Set();

                    canvas.tokens.controlled.forEach(token => {
                        let currentName = token.name;
                        let existingTitle = preserveTitles
                            ? titles.find(title => currentName.includes(title))
                            : null;

                        let newName = getRandomName(names, usedNames);
                        usedNames.add(newName);

                        const finalName = existingTitle ? `${existingTitle} ${newName}` : newName;

                        token.document.update({
                            name: finalName,
                            displayName: CONST.TOKEN_DISPLAY_MODES.ALWAYS
                        });
                    });

                    ui.notifications.info(`Names assigned from the '${selectedCategory}' category.`);
                }
            },
            cancel: {
                label: "Cancel"
            }
        }
    }).render(true);
}
