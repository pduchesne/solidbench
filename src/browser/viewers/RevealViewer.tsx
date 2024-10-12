import React, {useEffect, useRef } from "react";
import {PromiseStateContainer, usePromiseFn} from "@hilats/react-utils";

//@ts-ignore
import "reveal.js/dist/reveal.css";
import "reveal.js/dist/theme/black.css";
import Reveal from 'reveal.js';
//@ts-ignore
import RevealMarkdown from 'reveal.js/plugin/markdown/markdown.js';

export const RevealViewer = (props:{uri?: string, content: Blob | string, type?: string}) => {

    const contentString$ = usePromiseFn(async () => {
        return props.content instanceof Blob ? props.content.text() : props.content;
    }, [props.content]);

    return <div className="reveal-viewport"><PromiseStateContainer promiseState={contentString$}>
        {(content) => <RevealRenderer content={content}/>}
    </PromiseStateContainer></div>

    /*
        const [contentRef, setContentRef] = useState<HTMLIFrameElement | null>(null);
        const mountNode = contentRef?.contentWindow?.document?.body

    return <div className="reveal-container"><PromiseStateContainer promiseState={contentString$}>
        {(content) => <iframe ref={setContentRef}>
            {mountNode && createPortal(<body><html>
            <head><style dangerouslySetInnerHTML={{__html: revealCss}} /></head>
            <RevealRenderer content={content}/>
            </html></body>, mountNode)}
        </iframe>}
    </PromiseStateContainer>
    </div>

     */

}

const RevealRenderer = (props: { content: string }) => {

    const deckDivRef = useRef<HTMLDivElement>(null);
    const deckRef = useRef<Reveal.Api | null>(null);

    useEffect(() => {
        // Prevents double initialization in strict mode
        if (deckRef.current) return;

        deckRef.current = new Reveal(deckDivRef.current!, {
            plugins: [RevealMarkdown],
            transition: "slide",
            embedded: true,
            "controls": true,
            "progress": true,
            markdown: {
                smartypants: true
            }
            // other config options
        });

        deckRef.current.initialize().then(() => {
            // good place for event handlers and plugin setups
        });

        return () => {
            try {
                if (deckRef.current) {
                    deckRef.current.destroy();
                    deckRef.current = null;
                }
            } catch (e) {
                console.warn("Reveal.js destroy call failed.");
            }
        };
    }, []);

    return <div className="reveal" ref={deckDivRef}>
            <div className="slides">
                <section data-markdown={""}  data-separator="^---"
                         data-separator-vertical="^--">
                    <script type="text/template" dangerouslySetInnerHTML={{__html: props.content}}/>
                </section>
            </div>
    </div>

}

export default RevealViewer;