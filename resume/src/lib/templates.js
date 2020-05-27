import {info} from "./logging.js";

/**
 * @param {string} variable the variable that was not found
 * @returns {string} The name of the variable that was not found, wrapped in a span element to enable
 * appropriate formatting
 */
const dataNotFoundMessage = (variable) => `<span class="data-binding-error">${variable}</span>`

/**
 * @returns {RegExp} the template pattern used in the page, for example
 * <code>/\${([\w\\.]+)}/g</code> matches the template <code>${some.value}</code>.
 */
const dataBindPattern = () => /\${\s?([\w\\.]+)\s?}/g

/**
 * @param {*} data containing the value
 * @param {string} fullyQualifiedPath the path to the value
 * @returns The value at the fully qualified path in the given data
 * @example
 * const data = {
 *     "person": {
 *         "name": {
 *             "first": "Ada"
 *             "last": "Lovelace"
 *         }
 *     }
 * }
 * const value = valueFromFullyQualifiedPath(data, "person.name.first")
 * console.log(value)
 * > Ada
 */
function valueFromFullyQualifiedPath(data, fullyQualifiedPath) {
    if (typeof data === 'object') {
        let value = data
        for (const pathElement of fullyQualifiedPath.split(".")) {
            value = value[pathElement]
        }
        return value;
    } else if (typeof data === 'string') {
        return data
    } else {
        return undefined
    }
}

/**
 * Provides the bound value to insert into a template
 * @param {*} data
 * @param {function(string): string} dataNotFoundMessage function providing a helpful 'not found' message if a value is not found
 * @returns {function(match, group): string} a replacer function to pass along to string.replace after
 *          template match
 * @see String.replace
 */
function mergeWithContent(data, dataNotFoundMessage) {
    return (match, valueName) => {
        return valueFromFullyQualifiedPath(data, valueName) || dataNotFoundMessage(match);
    };
}

/**
 * Merges the data into the content where indicated by the content placeholders. For example, given the content
 * <code><pre>
 *   First Name: ${person.name.first}
 *   Last Name: ${person.name.last}
 * </pre></code>
 *
 * And the data
 * <code><pre>
 * const data = {
 *     "person": {
 *         "name": {
 *             "first": "Ada"
 *             "last": "Lovelace"
 *         }
 *     }
 * }
 * </pre></code>
 * This function would produce
 * <code><pre>
 *   First Name: Ada
 *   Last Name: Lovelace
 * </pre></code>
 * @param {string} content the string to accept data insertion
 * @param {*} data the data to merge into the content
 * @returns the content with the merged data
 *
 */
export function merge(content, data) {
    return content.replace(dataBindPattern(), mergeWithContent(data, dataNotFoundMessage))
}

/**
 * Creates an element from a template, appends it to a parent and populates its data
 * @param templateId
 * @param element
 * @param subsetDataItem
 */
function createChildFromTemplate(templateId, element, subsetDataItem) {
    const documentFragment = document.getElementById(templateId).content.cloneNode(true)
    element.appendChild(documentFragment).element
    const childNode = element.lastElementChild
    childNode.innerHTML = merge(childNode.innerHTML, subsetDataItem)
    for (const template of childNode.querySelectorAll("[data-template]")) {
        loadTemplate(template, subsetDataItem)
    }
}

/**
 * @param fullyQualifiedPath the path to the data, such as <code>experience.selelected.bullets</code>
 * @returns {string} the first part of the path, for example, <code>experience</code> in the above path
 */
export function rootOf(fullyQualifiedPath) {
    return fullyQualifiedPath.split(".")[0];
}

export function loadTemplate(node, nodeData) {
    const templateId = node.getAttribute("data-template")
    const dataSetName = node.getAttribute("data-source")
    const dataSet = valueFromFullyQualifiedPath(nodeData, dataSetName)
    if (Array.isArray(dataSet)) {
        for (const subsetDataItem of dataSet) {
            createChildFromTemplate(templateId, node, subsetDataItem);
        }
    } else {
        createChildFromTemplate(templateId, node, dataSet)
    }
}

/**
 * Event indicating that data for a template is ready for consumption, presumably after a download or some
 * long computation.
 */
export class TemplateDataReadyEvent extends CustomEvent {
    constructor(dataSet, datasetName) {
        super('template-data-ready', {
            detail: {
                dataSet: dataSet,
                dataSetName: datasetName
            }
        });
    }
}

/**
 * @param {*} dataSet the data that is ready
 * @param {string} dataSetName the name of the data set
 * @returns {TemplateDataReadyEvent}  a new TemplateDataReadyEvent
 */
export function templateDataReadyEvent(dataSet, dataSetName) {
    return new TemplateDataReadyEvent(dataSet, dataSetName)
}

export function fillTemplateData() {
    return dataReadyEvent => {
        const affectedTemplates = document.querySelectorAll(`[data-source^='${dataReadyEvent.detail.dataSetName}']`)
        info(`Received '${dataReadyEvent.detail.dataSetName}' data`)
        info(`${affectedTemplates.length} template(s) dependent on '${dataReadyEvent.detail.dataSetName}' data. Forwarding...`)
        info(affectedTemplates)
        for (const template of affectedTemplates) {
            const dataStore = {}
            dataStore[dataReadyEvent.detail.dataSetName] = dataReadyEvent.detail.dataSet
            loadTemplate(template, dataStore)
        }
    };
}

