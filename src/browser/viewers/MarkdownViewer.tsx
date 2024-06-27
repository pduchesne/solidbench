import React from "react";
import Markdown from "react-markdown";
import {PromiseStateContainer, usePromiseFn} from "@hilats/react-utils";
// @ts-ignore
import simplePlantUML from "@akebifiky/remark-simple-plantuml";

export const MarkdownViewer = (props:{uri?: string, content: Blob | string, type?: string}) => {

    const contentString$ = usePromiseFn( async () => {
        return props.content instanceof Blob ? props.content.text() : props.content;
    }, [props.content]);

    return <PromiseStateContainer promiseState={contentString$}>
        {(content) => <div><Markdown remarkPlugins={[simplePlantUML]}>{content}</Markdown></div>}
    </PromiseStateContainer>

}

export default MarkdownViewer;