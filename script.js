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
    // Filter out used names
    const availableNames = names.filter(name => !usedNames.has(name));

    // Return a random name if available, or reuse names from the full list
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
        <p>Select a naming category:</p>
        <form>
            <div class="form-group">
                <label for="name-category">Name Category</label>
                <select id="name-category" name="category">
                    ${categories.map(cat => `<option value="${cat}">${cat}</option>`).join('')}
                </select>
            </div>
        </form>
    `;

    new Dialog({
        title: "Select Name Category",
        content: content,
        buttons: {
            confirm: {
                label: "Assign Names",
                callback: async (html) => {
                    const selectedCategory = html.find("#name-category").val();
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
                        let existingTitle = titles.find(title => currentName.includes(title));

                        // Get a random unique name
                        let newName = getRandomName(names, usedNames);
                        usedNames.add(newName);

                        // Construct the final name
                        const finalName = existingTitle ? `${existingTitle} ${newName}` : newName;

                        // Update the token's name
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

// Run the script
assignNamesFromApi();
