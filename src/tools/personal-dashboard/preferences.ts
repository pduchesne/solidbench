export type Preferences = {
    pods: {
        alias: string,
        uri: string,
        webId?: string
    }[],
    proxyUrl?: string,
    theme: 'auto' | string
}
