export function jsonToString(content : any){
    const contentString =
    typeof content=== "string"
        ? content
        : JSON.stringify(content);

    return contentString
}