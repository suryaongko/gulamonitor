'use server';
/**
 * @fileOverview An AI agent that analyzes blood sugar patterns and provides personalized insights, trends, and actionable recommendations.
 *
 * - analyzeBloodSugarPatterns - A function that handles the blood sugar pattern analysis process.
 * - AIHealthInsightToolInput - The input type for the analyzeBloodSugarPatterns function.
 * - AIHealthInsightToolOutput - The return type for the analyzeBloodSugarPatterns function.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

// Input Schema Definition
const AIHealthInsightToolInputSchema = z.object({
  readings: z.array(
    z.object({
      value: z.number().describe('The blood sugar reading value.'),
      timestamp: z.string().describe('The ISO 8601 timestamp of the reading (e.g., "2023-10-27T10:30:00Z").'),
    })
  ).describe('A list of blood sugar readings, each with a value and timestamp.'),
  minHealthyRange: z.number().describe('The minimum value of the user-defined healthy blood sugar range.'),
  maxHealthyRange: z.number().describe('The maximum value of the user-defined healthy blood sugar range.'),
  additionalContext: z.string().optional().describe('Any additional information from the user regarding their diet, exercise, medication, or general health.'),
});
export type AIHealthInsightToolInput = z.infer<typeof AIHealthInsightToolInputSchema>;

// Output Schema Definition
const AIHealthInsightToolOutputSchema = z.object({
  summary: z.string().describe('A comprehensive summary of the blood sugar analysis, including key insights, identified patterns, and potential implications.'),
  trends: z.string().describe('Identified trends in blood sugar levels over the provided period, such as rising, falling, or fluctuating patterns.'),
  actionableRecommendations: z.string().describe('Practical, actionable recommendations based on the analysis to help the user manage their blood sugar levels better.'),
});
export type AIHealthInsightToolOutput = z.infer<typeof AIHealthInsightToolOutputSchema>;

// Prompt Definition
const analyzeBloodSugarPrompt = ai.definePrompt({
  name: 'analyzeBloodSugarPrompt',
  input: { schema: AIHealthInsightToolInputSchema },
  output: { schema: AIHealthInsightToolOutputSchema },
  prompt: `You are an expert health analyst specializing in blood sugar management. Your task is to analyze the provided blood sugar readings, compare them against the user's healthy range, and offer personalized insights, trends, and actionable recommendations.

Here are the user's blood sugar readings:
{{#each readings}}
  - Value: {{this.value}}, Timestamp: {{this.timestamp}}
{{/each}}

User's healthy blood sugar range:
Minimum: {{{minHealthyRange}}}
Maximum: {{{maxHealthyRange}}}

{{#if additionalContext}}
Additional context from the user:
{{{additionalContext}}}
{{/if}}

Please provide a detailed analysis focusing on:
1.  **Summary**: A comprehensive summary of the blood sugar analysis, including key insights, identified patterns, and potential implications.
2.  **Trends**: Identified trends in blood sugar levels over the provided period, such as rising, falling, or fluctuating patterns.
3.  **Actionable Recommendations**: Practical, actionable recommendations based on the analysis to help the user manage their blood sugar levels better.

Consider:
-   Fluctuations (e.g., morning spikes, post-meal highs, post-meal lows).
-   Consistency of readings within or outside the healthy range.
-   Impact of any provided \`additionalContext\`.
-   Long-term patterns if sufficient data is provided.
-   The timing of readings relative to meals or activities, if inferable from timestamps.

Ensure your analysis is encouraging, informative, and easy to understand for a layperson.
`,
});

// Flow Definition
const analyzeBloodSugarPatternsFlow = ai.defineFlow(
  {
    name: 'analyzeBloodSugarPatternsFlow',
    inputSchema: AIHealthInsightToolInputSchema,
    outputSchema: AIHealthInsightToolOutputSchema,
  },
  async (input) => {
    const { output } = await analyzeBloodSugarPrompt(input);
    if (!output) {
      throw new Error('Failed to generate blood sugar insights.');
    }
    return output;
  }
);

// Wrapper Function
export async function analyzeBloodSugarPatterns(input: AIHealthInsightToolInput): Promise<AIHealthInsightToolOutput> {
  return analyzeBloodSugarPatternsFlow(input);
}
