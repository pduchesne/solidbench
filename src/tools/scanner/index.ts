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


export type ScanMetadata = {
    name?: string
} & ({
    type: 'file',
    size: number,
    contentType: string | undefined,
    shapeMatches?: Record<string, number>
} | {
    type: 'container',
    resourceCount: number,
    resources: ScanMetadata[]
})

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
        resourceCount: subResources.length,
        resources: subResourcesMetadata
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
            size: parseInt(response.headers.get('content-length') || 'NaN'),
            contentType: getContentType(resourceInfo) || undefined,
            name: getResourceName(resourceUri)
        }
    } else {

        const result: ScanMetadata = {
            type: 'file',
            size: parseInt(response.headers.get('content-length') || 'NaN'),
            contentType: getContentType(resourceInfo) || undefined,
            name: getResourceName(resourceUri)
        }

        if (options?.shapes && result.contentType?.startsWith('text/turtle')) {
            const contentResponse = await (options?.fetch ?? fetch)(resourceUri, {method: "GET"});
            const turtleStr = await contentResponse.text();

            // compute a map of number of positive matches per shapeId
            const shapeMatches = options?.shapes &&
                Object.entries(options.shapes).reduce<Record<string, number>>(
                    (result, [id, shape]) => {
                        const matches = findMatches(shape, turtleStr);
                        result[id] = matches.filter(m => m.status == 'conformant').length;
                        return result;
                    }, {});

            result.shapeMatches = shapeMatches;
        }

        return result;
    }
}