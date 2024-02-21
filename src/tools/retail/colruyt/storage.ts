import {TypedArray} from "pdfjs-dist/types/src/display/api";
import {parsePdfData} from "./parser";

export const PATH_RETAILER_EIN_MAP = 'ein_map.json';


export class ColruytStorage {

    podUri: string;
    fetch: typeof fetch;

    constructor(podUri: string, options: {fetch?: typeof fetch}) {
        this.podUri = podUri
        this.fetch = options?.fetch || fetch;
    }

    async appendPdf(pdfData: Blob | string | URL | TypedArray | ArrayBuffer) {
        const parsed = await parsePdfData(pdfData);

        parsed

    }

}