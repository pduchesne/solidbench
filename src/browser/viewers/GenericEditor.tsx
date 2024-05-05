import {MIME_REGISTRY, WELL_KNOWN_TYPES} from "@hilats/utils";
import React from "react";
import {ContentViewerProps} from "./GenericViewer";
import CodemirrorEditor from "./CodemirrorEditor";

export type ContentEditorProps = ContentViewerProps & {onSave: (content: Blob | string) => Promise<void>};
export type ContentEditor = React.ComponentType<ContentEditorProps>;

const EDITORS: Record<string, ContentEditor> = {

}

const DEFAULT_EDITOR = CodemirrorEditor;

export const GenericEditor: ContentEditor = (props) => {

    let contentType = props.type || (props.content instanceof Blob ? props.content.type : undefined);
    if ( (! contentType || contentType == WELL_KNOWN_TYPES.bin) && props.uri) contentType = MIME_REGISTRY.guessMimeType(props.uri);

    const Editor = (contentType && EDITORS[contentType]) || DEFAULT_EDITOR;

    return <Editor {...props} />;
}