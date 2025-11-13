import { config } from 'dotenv';
config();

import '@/ai/flows/improve-prompt.ts';
import '@/ai/flows/summarize-chat-history.ts';
import '@/ai/flows/chat.ts';
import '@/ai/flows/shopify-tools.ts';
import '@/ai/flows/generate-design.ts';
import '@/ai/flows/create-draft-order.ts';
