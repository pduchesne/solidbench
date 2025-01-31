import { Assistant, Preferences } from "@hilats/solid-app-assistant";

export class AnnotationAssistant extends Assistant {

    constructor(prefs: Preferences) {
        super(prefs)
    }

    async annotate(text: string, prompt: string) {
        const response = await super.execute([
            {
                "role": "developer",
                "content": [
                    {
                        "type": "text",
                        "text": "A text will be provided in the next message, and then a question or request from a user in the following message. Result must be a JSON object with one property 'results'" +
                                " containing an array, where each item represents an answer and has the form " +
                                "```{offset: number, length: number, excerpt1: string, excerpt2: string, summary: string}```, where \n" +
                                " - `excerpt1` is the first 5 words of the text section that back up the answer\n" +
                                " - `excerpt2` is the last 5 words of that text section \n" +
                                " - offset is the text offset of the start that section in the original text \n" +
                                " - length is the number of characters of the text section \n" +
                                " - summary is an explanation of the answer, if needed \n\n" +
                                " In that context, the text offset of a word is the exact number of characters, including whitespace, counted from the start of the text"
                    }
                ]
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": "The text is ```"+text+"```"
                    }
                ]
            },
            {
                "role": "user",
                "content": [
                    {
                        "type": "text",
                        "text": prompt
                    }
                ]
            }
        ], {response_format: { "type": "json_object" }, model: "gpt-4o-mini"});

        const allResults: {offset: number, length: number, excerpt1: string, excerpt2: string, summary: string}[] = [];
        response.choices.forEach(c => {
            try {
                if (c.message.content) {
                    const results = JSON.parse(c.message.content).results as [];
                    allResults.push(...results);
                }
            } catch (e) {
                console.warn(e);
            }
        });

        // let's fix the char counts - LLMs can't count
        allResults.forEach(r => {
            const newStartOffset = r.excerpt1 ? text.indexOf(r.excerpt1) : -1;
            if (newStartOffset >=0) r.offset = newStartOffset;
            else
                console.warn("Assistant: failed to process excerpt1: "+r.excerpt1);

            const endIdx = r.excerpt2 ? text.indexOf(r.excerpt2) : -1;
            if (endIdx >= 0) {
                r.length = endIdx + r.excerpt2.length - r.offset;
            } else
                console.warn("Assistant: failed to process excerpt2: "+r.excerpt2);

        })

        return allResults;
    }
}