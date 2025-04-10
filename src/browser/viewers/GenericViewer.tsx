import {FetchOptions, MIME_REGISTRY, WELL_KNOWN_TYPES} from "@hilats/utils";
import React, {useEffect, useMemo} from "react";
import IFrameViewer from "./IFrameViewer";
import MarkdownViewer from "./MarkdownViewer";
import MonacoEditor from "./MonacoEditor";
import {ResourceAction} from "../pod-browser";
import AsciiDocViewer from "./AsciidocViewer";
import RevealViewer from "./RevealViewer";
import {
    WebResourceDescriptor,
    WebResourceDescriptorContent,
    useWebResource,
    PromiseStateContainer,
    WebResourceContentType
} from "@hilats/react-utils";


// A ContentViewer can take any kind of WebResourceDescriptor, i.e. by URI or inline
export type ContentViewerProps = {
    setResourceActions?: (actions: ResourceAction[]) => void,
    fullscreen?: boolean,
    resource: WebResourceDescriptor,
    fetchOptions?: FetchOptions,
};

export type ResolvedContentViewerProps<T extends WebResourceContentType = WebResourceContentType> =
    ContentViewerProps
    & { resource: WebResourceDescriptorContent<T> }

export type ContentViewer = React.ComponentType<ContentViewerProps>;

/**
 * This decorator takes a Component that requires an inline WebResource, and wraps it into a Component that accepts a URI, and handles the async fetch
 * @param Comp
 * @param fetchOptions
 */
export function withResolvableUri<T extends {resource: WebResourceDescriptorContent<'object'>}>(Comp: React.ComponentType<T>, fetchOptions?: FetchOptions & {as: 'json'}): React.ComponentType<Omit<T, 'resource'> & {resource: WebResourceDescriptor, fetchOptions?: FetchOptions}>;
export function withResolvableUri<T extends {resource: WebResourceDescriptorContent<'string'>}>(Comp: React.ComponentType<T>, fetchOptions?: FetchOptions & {as: 'text'}): React.ComponentType<Omit<T, 'resource'> & {resource: WebResourceDescriptor, fetchOptions?: FetchOptions}>;
export function withResolvableUri<T extends { resource: WebResourceDescriptorContent }>(
    Comp: React.ComponentType<T>, decoratorFetchOptions?: FetchOptions
): React.ComponentType<T & { resource: WebResourceDescriptor, fetchOptions?: FetchOptions }> {

    const WithResolvableUriComp = (props: T & { resource: WebResourceDescriptor, fetchOptions?: FetchOptions }) => {

        const {fetchOptions, resource, ...otherProps} = props;

        useEffect(() => {
            console.log("Change resource")
        }, [props.resource])
        useEffect(() => {
            console.log("Change fetchOptions")
        }, [props.fetchOptions])
        useEffect(() => {
            console.log("Change setResourceActions")
        }, [(props as any).setResourceActions])

        const allFetchOptions = useMemo(() => {
                return {...decoratorFetchOptions, ...fetchOptions}
            },
            [decoratorFetchOptions, fetchOptions]);

        const resourceContent$ = useWebResource(
            resource,
            allFetchOptions);

        return <PromiseStateContainer promiseState={resourceContent$}>
            {(resourceContent) => resourceContent ?
                <Comp {...otherProps as T} resource={resourceContent}/> :
                <div>
                    Resource not found
                </div>
            }
        </PromiseStateContainer>
    }

    return WithResolvableUriComp;
}


MIME_REGISTRY.registerMimeExtension("revealmd", "text/reveal+markdown");

const VIEWERS: Record<string, ContentViewer> = {
    [WELL_KNOWN_TYPES.html]: IFrameViewer,
    [WELL_KNOWN_TYPES.md]: MarkdownViewer,
    [WELL_KNOWN_TYPES.adoc]: AsciiDocViewer,
    ["text/reveal+markdown"]: RevealViewer,

    // Certain types don't need a viewer, they go straight into the editor
    [WELL_KNOWN_TYPES.ttl]: MonacoEditor,
    [WELL_KNOWN_TYPES.nq]: MonacoEditor,
    [WELL_KNOWN_TYPES.json]: MonacoEditor,
    [WELL_KNOWN_TYPES.jsonld]: MonacoEditor,
    [WELL_KNOWN_TYPES.nt]: MonacoEditor,
    [WELL_KNOWN_TYPES.xml]: MonacoEditor,
}

const DEFAULT_VIEWER = IFrameViewer;

// TODO move this into hilats-utils
export function guessContentType(resource: WebResourceDescriptor) {
    let type = resource.type || ('content' in resource && resource.content instanceof Blob ? resource.content.type : undefined);
    if ((!type || type == WELL_KNOWN_TYPES.bin || type == WELL_KNOWN_TYPES.txt) && resource.uri)
        type = MIME_REGISTRY.guessMimeType(resource.uri);

    return {...resource, type};
}

export function getViewer(resource: WebResourceDescriptor): [ContentViewer, WebResourceDescriptor] {
    resource = guessContentType(resource);

    return [
        (resource.type && VIEWERS[resource.type]) || DEFAULT_VIEWER,
        resource
    ];
}

export const GenericViewer: ContentViewer = (props) => {

    const [Viewer, resourceWithType] = useMemo(() => getViewer(props.resource), [props.resource]);

    return <Viewer {...props} resource={resourceWithType}/>;
}