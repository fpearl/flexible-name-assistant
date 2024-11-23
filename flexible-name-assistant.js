/*!
 * Flexible Name Assistant
 * Version: 1.1.0
 * Author: Frederic Pearl
 * License: Custom License - Flexible Name Assistant Module License v1.0
 *
 * This script dynamically assigns names to tokens in Foundry VTT based on customizable categories.
 * Includes an optional toggle for preserving command titles.
 */

// Hook into Foundry when the game is ready
Hooks.on("ready", () => {
    console.log("Flexible Name Assistant module loaded. Version: 1.1.0");

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

// Simulated API Call
async function fetchNamesAndTitlesFromApi(category) {
    const mockResponse = {
        categories: {
            Eldari: {
                names: [
                    "Aerendil", "Amara", "Anariel", "Aranel", "Aurelia", "Caladwen", "Celandine", "Elenna",
                    "Elyssia", "Faelivrin", "Galadriel", "Ithilwen", "Isilme", "Lorien", "Melian", "Nimloth",
                    "Sylvara", "Thalassa", "Vaeloria", "Yavanna", "Aerion", "Althion", "Ardion", "Calion",
                    "Eryndor", "Faelar", "Nithion", "Ralion", "Varis", "Zeryth"
                ],
                titles: ["Operative", "Captain", "Starweaver", "Mooncaller", "Lightbearer"]
            },
            Wastelander: {
                names: ["Rustclaw", "Shadehound", "Grease Fang", "Mudcrawler"],
                titles: ["Scraplord", "Scavenger", "Warlord", "Pit Boss", "Road King"]
            },
            Undead: {
                names: ["Hauntcaller", "Wraithcaller", "Sorrowbane", "Void Herald"],
                titles: ["Bone King", "Lich Lord", "Spectral Warden", "Dread Overlord", "Crypt Keeper"]
            }
        }
    };

    if (!mockResponse.categories[category]) {
        console.error(`Category ${category} not found in response!`);
        return { names: [], titles: [] };
    }

    return mockResponse.categories[category];
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
    const categories = ["Eldari", "Wastelander", "Undead"];

    let content = `
        <p>Select a naming category and toggle title preservation:</p>
        <form>
            <div class="form-group">
                <label for="name-category">Name Category</label>
                <select id="name-category" name="category">
                    ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
            </div>
            <div class="form-group">
                <label for="title-preservation">Preserve Titles</label>
                <input type="checkbox" id="title-preservation" name="preserveTitles" checked />
            </div>
        </form>
    `;

    new Dialog({
        title: "Flexible Name Assignment",
        content: content,
        buttons: {
            confirm: {
                label: "Assign Names",
                callback: async (html) => {
                    const selectedCategory = html.find("#name-category").val();
                    const preserveTitles = html.find("#title-preservation").is(":checked");
                    const data = await fetchNamesAndTitlesFromApi(selectedCategory);

                    const names = [...data.names];
                    const titles = data.titles || [];
                    const usedNames = new Set();

                    if (!names.length) {
                        ui.notifications.warn(`No names found for the selected category: ${selectedCategory}.`);
                        return;
                    }

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
