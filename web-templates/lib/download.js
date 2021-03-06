import {error, info} from "./logging.js";
import {rootOf, templateDataReadyEvent} from "./templates.js";
import {notDefined} from "./valueSafety.js";

export function verifyStatus(response) {
    if (response.status >= 200 && response.status < 300) {
        return Promise.resolve(response)
    } else {
        return Promise.reject(new Error(response.statusText))
    }
}

function tee(fn) {
    return _ => {
        fn(_)
        return _
    }
}

function addSpinner(htmlElement) {
    return () => {
        const spinner = document.getElementById("spinner").content.cloneNode(true)
        htmlElement.appendChild(spinner)
    }
}

function removeSpinner(element, spinnerClass = 'fa-spin') {
    return () => {
        if (typeof element === 'string') {
            document.querySelector(`${element} span.${spinnerClass}`).remove()
        } else {
            element.querySelector(`span.${spinnerClass}`).remove()
        }
    }
}

export function dispatchDataReadyEvent(htmlElement, dataSetName) {
    return dataSet => {
        info(`dispatching 'DataReadyEvent' with '${dataSetName}'`)
        htmlElement.dispatchEvent(templateDataReadyEvent(dataSet, dataSetName))
    }
}

export async function readResponse(response) {
    // simulate network latency with random waits
    // await new Promise(r => setTimeout(r, Math.floor(Math.random() * 5000)))
    return response.json()
}

export function downloadTemplateData(dataLocations, onTemplateDataReady) {
    document.body.addEventListener('template-data-ready', onTemplateDataReady)
    const dataStatus = {}
    const downloadStatus = {}
    for (const [dataSetName, dataSource] of Object.entries(dataLocations)) {
        if (notDefined(dataStatus[dataSetName]) && notDefined(downloadStatus[dataSetName])) {
            info(`'${dataSetName}' not found locally. Downloading...`)
            downloadStatus[dataSetName] = true
            fetch(dataSource, {mode: "same-origin"})
                .then(verifyStatus)
                .then(readResponse)
                .then(dispatchDataReadyEvent(document.body, dataSetName))
                .catch(error)
        } else {
            console.log(`'${dataSetName}' found locally. Using cached value...`)
            dispatchDataReadyEvent(document.body, dataSetName)
        }
    }
}


