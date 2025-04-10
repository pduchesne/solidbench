import React from "react";
import Markdown from "react-markdown";
// @ts-ignore
import simplePlantUML from "@akebifiky/remark-simple-plantuml";
import {ResolvedContentViewerProps, withResolvableUri} from "./GenericViewer";

export const MarkdownViewer = withResolvableUri(
    (props: ResolvedContentViewerProps<'string'>) => {

    return <div className="paddedPanel">
        <Markdown remarkPlugins={[simplePlantUML]}>{props.resource.content}</Markdown></div>

    },
    {as: 'text'},
)

export default MarkdownViewer;