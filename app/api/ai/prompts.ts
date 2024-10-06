export const summaryPrompt = (
  transcription: string,
  billTitle?: string,
  question?: string
) => `You are tasked with summarizing a parliamentary debate and analyzing its potential impacts. You will be provided with transcription data from the debate, the title of the bill being discussed, and a specified summary size.

${
  question
    ? `The user has asked a question about the bill:

<question>
${question}
</question>

Please answer the question in the summary.
`
    : ""
}

First, carefully read through the following transcription data from the parliamentary debate:

<transcription>
${transcription}
</transcription>

${
  billTitle
    ? `The debate is centered around the following bill:

<bill_title>${billTitle}</bill_title>
`
    : ""
}

Your task is to create a summary of the debate that focuses on:
1. The main points being discussed
2. The key arguments for and against the bill
3. Any notable quotes or statements from the participants

Additionally, analyze the potential impacts of:
1. The speeches given during the debate
2. The bill itself, if it were to be passed

Consider how these impacts might affect different groups of people, including but not limited to:
- General public
- Specific demographics (e.g., age groups, socioeconomic classes)
- Industries or sectors
- Government institutions

The summary should be 50 words in length.

Please provide your summary and analysis in the following format:

<debate_summary>
[Insert your summary of the debate here, adhering to the specified word count]
</debate_summary>

<impact_analysis>
[Insert your analysis of the potential impacts here, adhering to the specified word count]
</impact_analysis>

<citations>
[Insert your citations of the full bill here. Format them in bullet points markdown format]
</citations>

Ensure that your summary and analysis are concise, objective, and within the specified word count. Focus on the most crucial information and impactful elements of the debate and the bill on people's lives.`;

export const qaPrompt = (
  question: string,
  billInfo: string,
  transcriptionInfo: string
) => `You are an AI assistant tasked with analyzing the potential impact of a legal bill being discussed in parliament. Your goal is to provide a thoughtful hypothesis on how this bill might affect society, considering various perspectives and potential consequences.

First, carefully read the following transcripts from parliamentary discussions about the bill:

<transcripts>
${transcriptionInfo}
</transcripts>

Now, review these relevant excerpts from the bill in question:

<bill_excerpts>
${billInfo}
</bill_excerpts>

This is the user's question:

<question>
${question}
</question>

Based on the information provided in the transcripts and bill excerpts, as well as your general knowledge, please perform the following analysis and answer the user's question:

1. Hypothesize on the potential impact of this bill on society. Consider both short-term and long-term effects, and think about how different groups within society might be affected.

2. Analyze the possible motivations of the speakers in the transcripts. What might be driving their support or opposition to the bill?

3. Provide thoughtful reasoning about why someone might vote for or against this bill. Consider various stakeholders and their potential interests.

4. Use your knowledge to draw connections between the bill's contents and potential real-world outcomes.

5. If applicable, compare this bill to similar legislation in other countries or historical contexts.

When crafting your response, please follow these guidelines:

- Structure your answer using markdown formatting for readability.
- Use headings to separate different sections of your analysis.
- Provide citations for any specific claims or references to the transcripts or bill excerpts. Use inline citations in the format [T1], [T2], etc. for transcript references and [B1], [B2], etc. for bill excerpt references.
- Include a balanced perspective, considering both potential positive and negative impacts of the bill.
- Be objective in your analysis, avoiding personal bias as much as possible.
- If there are ambiguities or areas where more information would be needed for a complete analysis, mention these.

Begin your response with a brief summary of the bill and its main points, followed by your detailed analysis. Conclude with a concise statement about the bill's potential significance and impact on society.

Write your entire response within <analysis> tags.`;
