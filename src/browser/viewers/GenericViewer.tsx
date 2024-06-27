import {MIME_REGISTRY, WELL_KNOWN_TYPES} from "@hilats/utils";
import React, {useMemo} from "react";
import IFrameViewer from "./IFrameViewer";
import MarkdownViewer from "./MarkdownViewer";
import MonacoEditor from "./MonacoEditor";
import {ResourceAction} from "../pod-browser";
import AsciiDocViewer from "./AsciidocViewer";

export type ContentViewerProps = {
    uri?: string,
    content: Blob | string,
    type?: string,
    setResourceActions?: (actions: ResourceAction[]) => void
};
export type ContentViewer = React.ComponentType<ContentViewerProps>;

const VIEWERS: Record<string, ContentViewer> = {
    [WELL_KNOWN_TYPES.html] : IFrameViewer,
    [WELL_KNOWN_TYPES.md] : MarkdownViewer,
    [WELL_KNOWN_TYPES.adoc] : AsciiDocViewer,

    // Certain types don't need a viewer, they go straight into the editor
    [WELL_KNOWN_TYPES.ttl] : MonacoEditor,
    [WELL_KNOWN_TYPES.nq] : MonacoEditor,
    [WELL_KNOWN_TYPES.json] : MonacoEditor,
    [WELL_KNOWN_TYPES.jsonld] : MonacoEditor,
    [WELL_KNOWN_TYPES.nt] : MonacoEditor,
    [WELL_KNOWN_TYPES.xml] : MonacoEditor,
}

const DEFAULT_VIEWER = IFrameViewer;

// TODO move this into hilats-utils
export function guessContentType(content: Blob | string | undefined, type?: string, uri?: string) {
    let contentType = type || (content instanceof Blob ? content.type : undefined);
    if ( (! contentType || contentType == WELL_KNOWN_TYPES.bin || contentType == WELL_KNOWN_TYPES.txt) && uri)
        contentType = MIME_REGISTRY.guessMimeType(uri);

    return contentType;
}

export function getViewer(uri?: string, type?: string, content?: string | Blob): [ContentViewer, string | undefined] {
    let contentType = guessContentType(content, type, uri);

    return [
        (contentType && VIEWERS[contentType]) || DEFAULT_VIEWER,
        contentType
    ];
}

export const GenericViewer: ContentViewer = (props) => {

    const [Viewer, contentType] = useMemo(()=> getViewer(props.uri, props.type, props.content), [props.content, props.type, props.uri]);

    return <Viewer {...props} type={contentType}/>;
}