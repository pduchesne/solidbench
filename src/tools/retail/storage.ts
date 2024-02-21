
export const PATH_METADATA = 'metadata.json';
export const PATH_RETAILER_PREFIX = 'retailers/';
export const PATH_RETAILER_EIN_MAP = 'ein_map.json';


export class RetailStorage {

    podUri: string;
    fetch: typeof fetch;

    constructor(podUri: string, options: {fetch?: typeof fetch}) {
        this.podUri = podUri
        this.fetch = options?.fetch || fetch;
    }

}