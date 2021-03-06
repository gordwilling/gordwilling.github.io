export const level = {
    info: "info",
    error: "error",
}

export let logLevel = level.info

export function info(message) {
    if (logLevel === level.info) {
        console.log(message)
    }
}

export function error(message) {
    console.log(message)
}
