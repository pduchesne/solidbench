import {PodStorage} from "@hilats/solid-utils";

export const PATH_EIN_MAP = 'colruyt_ein_map.json';

export type ColruytEanMap = Record<string, {ean?: string, label: string}>;

export class ColruytDbStorage extends PodStorage {

    private _einMap: Promise<ColruytEanMap> | undefined = undefined;

    constructor(podUri: string, options?: { fetch?: typeof fetch }) {
        super(podUri, options);
    }

    get einMap() {
        if (!this._einMap)
            this._einMap = this.readMap();

        return this._einMap;
    }

    async readMap() {
        return (await this.fetchJSON<ColruytEanMap>(PATH_EIN_MAP)) || {};
    }

    async putMap(map: ColruytEanMap) {
        const resp = this.putJSON(PATH_EIN_MAP, map);
        this._einMap = Promise.resolve(map);
        return resp;
    }
}