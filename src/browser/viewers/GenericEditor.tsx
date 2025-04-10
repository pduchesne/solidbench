import {WELL_KNOWN_TYPES} from "@hilats/utils";
import React, {useMemo} from "react";
import {
    ContentViewerProps,
    guessContentType,
    ResolvedContentViewerProps,
} from "./GenericViewer";
import CodemirrorEditor from "./CodemirrorEditor";
import MonacoEditor from "./MonacoEditor";
import {WebResourceContentType, WebResourceDescriptor } from "@hilats/react-utils";

export type ContentEditorProps = ContentViewerProps & {onSave?: (content: WebResourceContentType) => Promise<void>};
export type ContentEditor = React.ComponentType<ContentEditorProps>;

export type ResolvedContentEditorProps<T extends WebResourceContentType = WebResourceContentType> = ContentEditorProps & ResolvedContentViewerProps<T>

const EDITORS: Record<string, ContentEditor> = {
    [WELL_KNOWN_TYPES.ttl]: MonacoEditor,
    [WELL_KNOWN_TYPES.json]: MonacoEditor,
    [WELL_KNOWN_TYPES.md]: MonacoEditor,
    ["text/reveal+markdown"]: MonacoEditor
}

const DEFAULT_EDITOR = CodemirrorEditor;

export function getEditor(resource: WebResourceDescriptor): [ContentEditor, WebResourceDescriptor] {
    resource = guessContentType(resource);

    return [
        (resource.type && EDITORS[resource.type]) || DEFAULT_EDITOR,
        resource
        ];
}

export const GenericEditor: ContentEditor = (props) => {

    const [Editor, resourceWithType] = useMemo(()=> getEditor(props.resource), [props.resource]);

    return <Editor {...props} resource={resourceWithType}/>;
}