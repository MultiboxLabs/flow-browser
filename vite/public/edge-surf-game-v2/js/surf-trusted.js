/**
 * Copyright (C) Microsoft Corporation. All rights reserved.
 * Use of this source code is governed by a MIT license that can be
 * found in the LICENSE file.
 */

const STORAGE_KEY = "surfGameData";

// Default settings if localStorage is empty
const defaultGameData = {
    settings: {
        playerBodyColor: 5,
        playerHairStyle: 1,
        playerHairColor: 5,
        playerOutfitStyle: 0,
        playerOutfitColor: 2,
        playerExtraStyle: 1,
        gameSpeed: 1,
        theme: "horizon",
        hitbox: false,
        reducedMotion: false,
    },
    highScore: {
        endless: 0,
        timetrial: 0,
        zigzag: 0,
        collector: 0,
    },
};

function getGameData() {
    const storedData = localStorage.getItem(STORAGE_KEY);
    const parsedData = storedData ? JSON.parse(storedData) : defaultGameData;
    return { gameStats: JSON.stringify(parsedData) }; // Wrap in `gameStats`
}

function saveGameData(stats) {
    if (typeof stats === "string") {
        stats = JSON.parse(stats);
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

if (!localStorage.getItem(STORAGE_KEY)) {
    saveGameData(defaultGameData);
}

const MessagesEnum = {
    REQUEST_DATA: "requestData",
    RESIZE_IFRAME: "resizeIframe",
    SAVE_GAME_DATA: "saveGameData",
    GET_GAME_DATA: "getGameData",
    RECORD_ACTIONS: "recordActions",
    RECORD_THEME: "recordTheme",
    RECORD_GAME_MODE: "recordGameMode",
    RECORD_BODY_COLOR: "recordBodyColor",
    RECORD_OUTFIT_COLOR: "recordOutfitColor",
    RECORD_OUTFITS: "recordOutfits",
    RECORD_HAIR_COLOR: "recordHairColor",
    RECORD_HAIR_STYLE: "recordHairStyle",
    RECORD_ACCESSORY: "recordAccessory",
};

class SurfHandlerJS {
    constructor() {
        console.log("SurfHandlerJS initialized");
    }

    saveGameStats(gameStats) {
        console.log("saveGameStats:", gameStats);
        saveGameData(gameStats);
        return Promise.resolve();
    }

    async getGameStats() {
        return getGameData();
    }

    recordSurfActions(action) {
        console.log("recordSurfActions:", action);
    }

    recordSurfTheme(action) {
        console.log("recordSurfTheme:", action);
    }

    recordSurfGameMode(action) {
        console.log("recordSurfGameMode:", action);
    }

    recordSurfBodyColor(action) {
        console.log("recordSurfBodyColor:", action);
    }

    recordSurfOutfitColor(action) {
        console.log("recordSurfOutfitColor:", action);
    }

    recordSurfHairColor(action) {
        console.log("recordSurfHairColor:", action);
    }

    recordSurfOutfits(action) {
        console.log("recordSurfOutfits:", action);
    }

    recordSurfHairStyles(action) {
        console.log("recordSurfHairStyles:", action);
    }

    recordSurfAccessories(action) {
        console.log("recordSurfAccessories:", action);
    }
}

let surfHandler = null;

document.addEventListener("DOMContentLoaded", () => {
    surfHandler = new SurfHandlerJS();
});

window.addEventListener("message", (event) => {
    if (!event.data.type) {
        return;
    }

    console.log("Received message:", event.data.type);

    switch (event.data.type) {
        case MessagesEnum.REQUEST_DATA:
            event.source.postMessage({ type: "init", data: getGameData() }, "*");
            break;

        case MessagesEnum.SAVE_GAME_DATA:
            saveGameData(event.data.stats);
            break;

        case MessagesEnum.GET_GAME_DATA:
            surfHandler.getGameStats().then((result) => {
                event.source.postMessage(result, "*");
            });
            break;

        case MessagesEnum.RECORD_ACTIONS:
            surfHandler.recordSurfActions(event.data.action);
            break;

        case MessagesEnum.RECORD_THEME:
            surfHandler.recordSurfTheme(event.data.action);
            break;

        case MessagesEnum.RECORD_GAME_MODE:
            surfHandler.recordSurfGameMode(event.data.action);
            break;

        case MessagesEnum.RECORD_BODY_COLOR:
            surfHandler.recordSurfBodyColor(event.data.action);
            break;

        case MessagesEnum.RECORD_OUTFIT_COLOR:
            surfHandler.recordSurfOutfitColor(event.data.action);
            break;

        case MessagesEnum.RECORD_OUTFITS:
            surfHandler.recordSurfOutfits(event.data.action);
            break;

        case MessagesEnum.RECORD_HAIR_COLOR:
            surfHandler.recordSurfHairColor(event.data.action);
            break;

        case MessagesEnum.RECORD_HAIR_STYLE:
            surfHandler.recordSurfHairStyles(event.data.action);
            break;

        case MessagesEnum.RECORD_ACCESSORY:
            surfHandler.recordSurfAccessories(event.data.action);
            break;

        default:
            console.warn("Unknown message type:", event.data.type);
    }
});

// If iframe loaded early than handler initialized,
// this message will trigger iframe initialization.
const iframe = document.getElementById("untrusted-iframe");
iframe.contentWindow.postMessage(
    {
        type: "init",
        data: getGameData(),
    },
    "*"
);
