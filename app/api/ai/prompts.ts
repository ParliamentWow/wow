export const summaryPrompt = (
  context: string,
  billTitle?: string
) => `You are tasked with summarizing a parliamentary debate and analyzing its potential impacts. You will be provided with transcription data from the debate and other supporting information such as info about the bills.

First, carefully read through the following transcription data from the parliamentary debate:

<context>
${context}
</context>

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

Please provide your summary and analysis in the following markdown format:

## Debate Summary
[Insert your summary of the debate here, adhering to the specified word count]

## Impact Analysis
[Insert your analysis of the potential impacts here, adhering to the specified word count]

<if_relevant>
## Citations
[Insert your citations from the bill docs here. Make sure to include the url of the document.Format them in bullet points markdown format]
</if_relevant>

Ensure that your summary and analysis are concise, objective, and within the specified word count. Focus on the most crucial information and impactful elements of the debate and the bill on people's lives.`;

export const qAPrompt = (
  context: string,
  question: string
) => `You are Wow. You are a helpful assistant. You are tasked with answering a user's question about a parliamentary debate. You will be provided with transcription data from the debate, other supporting information such as excerpts from relevant bills, and the user's question.

First, carefully read through the following transcription and bill excerpts data from parliament:

<context>
${context}
</context>

The user has asked the following question:

<question>
Based on the context above: ${question}?
</question>

Your task is to answer the user's question based on the information provided. In your answer, consider:

1. Relevant points discussed in the debate
2. Arguments for and against the bill that relate to the question
3. Any notable quotes or statements from the participants that address the question
4. Potential impacts of the bill or the debate that are relevant to the question

Please provide your answer in a clear, concise manner. If the question cannot be fully answered based on the provided information, state this clearly and provide the most relevant information available.

Your response should be in the following format:

## Answer
[Insert your answer to the user's question here]


<if_relevant>
## Citations
[Insert your citations from the bill docs here. Make sure to include the url of the document.Format them in bullet points markdown format]
</if_relevant>


Ensure that your answer is objective and focuses on the information presented in the debate transcription. If there are multiple perspectives on the issue, present them fairly. If the question cannot be answered or is not relevant, state this clearly.`;
