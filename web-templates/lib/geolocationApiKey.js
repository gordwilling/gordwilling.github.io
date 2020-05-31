const restrictedKey = "AIzaSyCa4GQPYShvGawnTkh_XX4_n4coT77GBuw"

/**
 * Loads an unrestricted key from a local file for development work, otherwise
 * uses the open, heavily restricted key
 */
export function fetchApiKey() {
    return new Promise((resolve, reject) => {
        if (window.location.hostname === "localhost") {
            const xhr = new XMLHttpRequest()
            xhr.overrideMimeType("text/plain")
            xhr.open("GET", "../lib/geoLocationApiKey")
            xhr.onerror = reject
            xhr.onload = () => resolve(xhr.response)
            xhr.send()
        } else {
            resolve(restrictedKey)
        }
    })
}
