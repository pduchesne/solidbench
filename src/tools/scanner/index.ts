import {
    getContainedResourceUrlAll,
    getContentType,
    getSolidDataset,
    isContainer,
    isRawData, responseToResourceInfo
} from "@inrupt/solid-client";
import {assert} from "@hilats/utils";
import {getResourceName} from "@hilats/solid-utils";

export type ScanMetadata = {
    name?: string
} & ({
    type: 'file',
    size: number,
    contentType?: string,
    shapeMatches?: any[]
} | {
    type: 'container',
    resourceCount: number,
    resources: ScanMetadata[]
})

export async function scanContainer(containerUri: string, options?:{fetch?: typeof fetch, shapes?: any}): Promise<ScanMetadata> {

    const solidContainer = await getSolidDataset(containerUri, options);

    assert(isContainer(solidContainer), "Resource is not a container : " + containerUri);

    const subResources= getContainedResourceUrlAll(solidContainer);

    const subResourcesMetadata = await Promise.all(subResources.map(res => scanResource(res, options)));

    return {
        type: 'container',
        name: getResourceName(containerUri),
        resourceCount: subResources.length,
        resources: subResourcesMetadata
    }

}

export async function scanResource(resourceUri: string, options?:{fetch?: typeof fetch, shapes?: any}): Promise<ScanMetadata> {

    const response = await (options?.fetch ?? fetch)(resourceUri, { method: "HEAD" });
    const resourceInfo = responseToResourceInfo(response);

    if (isContainer(resourceInfo))
        return scanContainer(resourceUri, options);
    else if (isRawData(resourceInfo)){
        return {
            type: 'file',
            size: parseInt(response.headers.get('content-length') || 'NaN'),
            contentType: getContentType(resourceInfo) || undefined,
            name: getResourceName(resourceUri)
        }
    } else {
        //shapeMatches = matchShapes()

        return {
            type: 'file',
            size: parseInt(response.headers.get('content-length') || 'NaN'),
            contentType: getContentType(resourceInfo) || undefined,
            name: getResourceName(resourceUri)
        }
    }
}