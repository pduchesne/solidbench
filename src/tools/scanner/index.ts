import {
    getContainedResourceUrlAll,
    getContentType,
    getSolidDataset,
    isContainer,
    isRawData, responseToResourceInfo
} from "@inrupt/solid-client";
import {assert} from "@hilats/utils";
import {findMatches} from "./scanner";

export function getResourceName(uri: string) {
    const pathElements = uri.split('/');
    if (uri.endsWith('/')) {
        // this is a container
        return pathElements.at(-2) + '/'
    } else {
        return pathElements.at(-1)
    }
}


export type ScanMetadata<T extends ('file' | 'container') = 'file' | 'container'> = {
    name?: string,
    shapes: Record<string, number>,
    size: number,
    type: T,
} & ({
    type: 'file',
    contentType: string | undefined
} | {
    type: 'container',
    types: Record<string, number>,
    resources: ScanMetadata[]
})

function sumNumberRecords(records1: Record<string, number>, records2: Record<string, number>) {
    const result = {...records1};

    Object.entries(records2).forEach( ([key, value]) => key in result ? (result[key] += value) : (result[key] = value));

    return result;
}

export async function scanContainer(containerUri: string, options?: {
    fetch?: typeof fetch,
    shapes?: any
}): Promise<ScanMetadata> {

    const solidContainer = await getSolidDataset(containerUri, options);

    assert(isContainer(solidContainer), "Resource is not a container : " + containerUri);

    const subResources = getContainedResourceUrlAll(solidContainer);

    const subResourcesMetadata = await Promise.all(subResources.map(res => scanResource(res, options)));

    return {
        type: 'container',
        name: getResourceName(containerUri),
        size: subResourcesMetadata.reduce((size, res) => size + res.size, 0),
        resources: subResourcesMetadata,
        types: subResourcesMetadata.reduce<Record<string, number>>(
            (types, res) =>
                sumNumberRecords(types, res.type == 'container' ? res.types : {[res.contentType || 'undefined'] : 1}), {}),
        shapes: subResourcesMetadata.reduce<Record<string, number>>(
            (shapes, res) =>
                sumNumberRecords(shapes, res.shapes), {}),
    }

}

export async function scanResource(resourceUri: string, options?: {
    fetch?: typeof fetch,
    shapes?: Record<string, string>
}): Promise<ScanMetadata> {

    const response = await (options?.fetch ?? fetch)(resourceUri, {method: "HEAD"});
    const resourceInfo = responseToResourceInfo(response);

    if (isContainer(resourceInfo))
        return scanContainer(resourceUri, options);
    else if (isRawData(resourceInfo)) {
        return {
            type: 'file',
            size: parseInt(response.headers.get('content-length') || '0'),
            contentType: getContentType(resourceInfo) || undefined,
            name: getResourceName(resourceUri),
            shapes: {}
        }
    } else {

        const result: ScanMetadata = {
            type: 'file',
            size: parseInt(response.headers.get('content-length') || '0'),
            contentType: getContentType(resourceInfo) || undefined,
            name: getResourceName(resourceUri),
            shapes: {}
        }

        if (options?.shapes && result.contentType?.startsWith('text/turtle')) {
            const contentResponse = await (options?.fetch ?? fetch)(resourceUri, {method: "GET"});
            const turtleStr = await contentResponse.text();

            // compute a map of number of positive matches per shapeId
            const shapeMatches = options?.shapes &&
                Object.entries(options.shapes).reduce<Record<string, number>>(
                    (result, [id, shape]) => {
                        try {
                            const matches = findMatches(shape, turtleStr);
                            result[id] = matches.filter(m => m.status == 'conformant').length;
                            return result;
                        } catch (err) {
                            console.warn("Failed to scan resource for shape");
                            console.warn(err);
                            return result;
                        }
                    }, {});

            result.shapes = shapeMatches;
        }

        return result;
    }
}