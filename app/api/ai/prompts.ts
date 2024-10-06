export const summaryPrompt = (
  transcription: string,
  billTitle?: string,
  question?: string
) => `You are tasked with summarizing a parliamentary debate and analyzing its potential impacts. You will be provided with transcription data from the debate and other supporting information.

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

Please provide your summary and analysis in the following markdown format NOT XML TAGS:

## Debate Summary
[Insert your summary of the debate here, adhering to the specified word count]


## Impact Analysis
[Insert your analysis of the potential impacts here, adhering to the specified word count]

${
  billTitle
    ? `## Citations
[Insert your citations of the full bill here. Format them in bullet points markdown format]
`
    : ""
}

Ensure that your summary and analysis are concise, objective, and within the specified word count. Focus on the most crucial information and impactful elements of the debate and the bill on people's lives.`;
