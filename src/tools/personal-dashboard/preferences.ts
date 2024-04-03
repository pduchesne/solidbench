export type Preferences = {
    pods: {
        alias: string,
        uri: string,
        webId?: string
    }[],

    theme: 'auto' | string
}
