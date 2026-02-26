import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface AiProvider {
  classify(message: string): Promise<{ intent: string; confidence: number }>;
  suggestReply(conversationHistory: string[], lastMessage: string): Promise<string>;
  summarize(messages: string[]): Promise<string>;
}

@Injectable()
export class AiService implements AiProvider {
  private readonly logger = new Logger(AiService.name);
  private readonly provider: string;

  constructor(private readonly config: ConfigService) {
    this.provider = config.get('AI_PROVIDER', 'claude');
  }

  /**
   * Classify the intent of an inbound message.
   */
  async classify(message: string): Promise<{ intent: string; confidence: number }> {
    const prompt = `Classify the intent of this WhatsApp message into one of these categories:
- greeting
- product_inquiry
- order_status
- complaint
- support_request
- pricing
- appointment
- feedback
- opt_out
- other

Message: "${message}"

Respond with JSON only: {"intent": "...", "confidence": 0.0-1.0}`;

    const response = await this.callLLM(prompt);
    try {
      return JSON.parse(response);
    } catch {
      return { intent: 'other', confidence: 0.5 };
    }
  }

  /**
   * Suggest a reply based on conversation history.
   */
  async suggestReply(conversationHistory: string[], lastMessage: string): Promise<string> {
    const historyText = conversationHistory.slice(-10).join('\n');
    const prompt = `You are a helpful customer service agent. Based on this conversation history, suggest a professional reply.

Conversation:
${historyText}

Latest message from customer: "${lastMessage}"

Suggest a concise, helpful reply (1-3 sentences). Reply text only, no quotes.`;

    return this.callLLM(prompt);
  }

  /**
   * Summarize a conversation.
   */
  async summarize(messages: string[]): Promise<string> {
    const text = messages.slice(-30).join('\n');
    const prompt = `Summarize this WhatsApp conversation in 2-3 sentences. Focus on the main topic, customer issue, and resolution status.

Conversation:
${text}

Summary:`;

    return this.callLLM(prompt);
  }

  /**
   * Abstract LLM call — routes to Claude or OpenAI based on config.
   */
  private async callLLM(prompt: string): Promise<string> {
    if (this.provider === 'claude') {
      return this.callClaude(prompt);
    }
    return this.callOpenAI(prompt);
  }

  private async callClaude(prompt: string): Promise<string> {
    const apiKey = this.config.get('ANTHROPIC_API_KEY');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      this.logger.error(`Claude API error: ${errText}`);
      throw new Error('AI provider error');
    }

    // ✅ FIX: json() est typed unknown, on caste en any
    const result: any = await response.json();
    return result?.content?.[0]?.text ?? '';
  }

  private async callOpenAI(prompt: string): Promise<string> {
    const apiKey = this.config.get('OPENAI_API_KEY');

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      this.logger.error(`OpenAI API error: ${errText}`);
      throw new Error('AI provider error');
    }

    // ✅ FIX: json() est typed unknown, on caste en any
    const result: any = await response.json();
    return result?.choices?.[0]?.message?.content ?? '';
  }
}