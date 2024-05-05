import {MIME_REGISTRY, WELL_KNOWN_TYPES} from "@hilats/utils";
import React from "react";
import IFrameViewer from "./IFrameViewer";

export type ContentViewerProps = {uri?: string, content: Blob | string, type?: string};
export type ContentViewer = React.ComponentType<ContentViewerProps>;

const VIEWERS: Record<string, ContentViewer> = {
    [WELL_KNOWN_TYPES.html] : IFrameViewer
}

const DEFAULT_VIEWER = IFrameViewer;

export const GenericViewer: ContentViewer = (props) => {

    let contentType = props.type || (props.content instanceof Blob ? props.content.type : undefined);
    if ( (! contentType || contentType == WELL_KNOWN_TYPES.bin) && props.uri) contentType = MIME_REGISTRY.guessMimeType(props.uri);

    const Viewer = (contentType && VIEWERS[contentType]) || DEFAULT_VIEWER;

    return <Viewer {...props} />;
}