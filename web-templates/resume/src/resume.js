import {fillTemplateData, merge} from "../../lib/templates.js";
import {downloadTemplateData} from "../../lib/download.js";

function initTemplates() {
    const dataLocations = {
        basics: "../data/basics.json",
        experience: "../data/experience.json",
        education: "../data/education.json",
        technology: "../data/technology.json"
    }

    const templateRefs = Array.from(document.querySelectorAll("[data-template]"))
    downloadTemplateData(templateRefs, dataLocations)
}

document.body.addEventListener('template-data-ready', fillTemplateData())
document.body.addEventListener("template-data-ready", (dataReady) => {
    if (dataReady.detail.dataSetName === 'basics') {
        document.title = merge(document.title, dataReady.detail.dataSet)
    }
})
window.onload = initTemplates
