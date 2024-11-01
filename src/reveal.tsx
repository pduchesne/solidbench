import * as React from 'react';
import { createRoot } from 'react-dom/client';
import {RevealIframeContent} from "./browser/viewers/RevealRenderer";

/**
 * Entry point to render a reveal.markdown file at the root
 */

const container = document.getElementById('index');
const root = createRoot(container!);

// the RevealIframeContent component expects a postMessage with the content to display
root.render(<RevealIframeContent />);