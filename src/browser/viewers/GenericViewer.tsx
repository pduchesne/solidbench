import {MIME_REGISTRY, WELL_KNOWN_TYPES} from "@hilats/utils";
import React from "react";
import IFrameViewer from "./IFrameViewer";
import MarkdownViewer from "./MarkdownViewer";

export type ContentViewerProps = {uri?: string, content: Blob | string, type?: string};
export type ContentViewer = React.ComponentType<ContentViewerProps>;

const VIEWERS: Record<string, ContentViewer> = {
    [WELL_KNOWN_TYPES.html] : IFrameViewer,
    [WELL_KNOWN_TYPES.md] : MarkdownViewer
}

const DEFAULT_VIEWER = IFrameViewer;

export function guessContentType(content: Blob | string, type?: string, uri?: string) {
    let contentType = type || (content instanceof Blob ? content.type : undefined);
    if ( (! contentType || contentType == WELL_KNOWN_TYPES.bin || contentType == WELL_KNOWN_TYPES.txt) && uri)
        contentType = MIME_REGISTRY.guessMimeType(uri);

    return contentType;
}

export const GenericViewer: ContentViewer = (props) => {

    let contentType = guessContentType(props.content, props.type, props.uri);

    const Viewer = (contentType && VIEWERS[contentType]) || DEFAULT_VIEWER;

    return <Viewer {...props} type={contentType}/>;
}