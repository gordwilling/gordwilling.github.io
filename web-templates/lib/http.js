export class BasicHttpRequest extends XMLHttpRequest {
    onSuccess = () => console.log('You must define a BasicHttpRequest.onSuccess handler')
    constructor() {
        super()
        this.onreadystatechange = () => {
            if (this.readyState === 4 && this.status === 200) {
                this.onSuccess(this.response)
            }
        }
    }
}
