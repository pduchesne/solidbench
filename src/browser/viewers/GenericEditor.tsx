import {WELL_KNOWN_TYPES} from "@hilats/utils";
import React from "react";
import {ContentViewerProps, guessContentType} from "./GenericViewer";
import CodemirrorEditor from "./CodemirrorEditor";
import MonacoEditor from "./MonacoEditor";

export type ContentEditorProps = ContentViewerProps & {onSave: (content: Blob | string) => Promise<void>};
export type ContentEditor = React.ComponentType<ContentEditorProps>;

const EDITORS: Record<string, ContentEditor> = {
    [WELL_KNOWN_TYPES.ttl]: MonacoEditor,
    [WELL_KNOWN_TYPES.json]: MonacoEditor,
    [WELL_KNOWN_TYPES.md]: MonacoEditor
}

const DEFAULT_EDITOR = CodemirrorEditor;

export const GenericEditor: ContentEditor = (props) => {
    let contentType = guessContentType(props.content, props.type, props.uri);

    const Editor = (contentType && EDITORS[contentType]) || DEFAULT_EDITOR;

    return <Editor {...props} type={contentType}/>;
}