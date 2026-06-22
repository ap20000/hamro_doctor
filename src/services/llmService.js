import axios from 'axios';

// Helper for waiting
const wait = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// Statistics tracking
const stats = {
  gemini: { successCount: 0, failureCount: 0 },
  openRouter: { successCount: 0, failureCount: 0 }
};

// Circuit Breaker State Management
const states = {
  gemini: {
    status: "ACTIVE", // ACTIVE or COOLDOWN
    lastFailureAt: null,
    failureReason: null,
    cooldownUntil: null
  },
  openRouter: {
    status: "ACTIVE",
    lastFailureAt: null,
    failureReason: null,
    cooldownUntil: null
  }
};

// Expose health statistics helper
export const getLLMHealth = () => {
  return {
    states,
    stats
  };
};

// Validate LLM provider configurations on startup
export const checkLLMConfig = () => {
  const geminiConfigured = !!process.env.GEMINI_API_KEY;
  const openRouterConfigured = !!process.env.OPENROUTER_API_KEY;

  if (geminiConfigured) {
    const isCooling = states.gemini.cooldownUntil && new Date() < states.gemini.cooldownUntil;
    if (isCooling) {
      console.log(`[LLM] Gemini cooldown active until ${states.gemini.cooldownUntil.toISOString()}`);
    } else {
      console.log('[LLM] Gemini available');
    }
  } else {
    console.warn('[LLM] Gemini API key missing');
  }

  if (openRouterConfigured) {
    const isCooling = states.openRouter.cooldownUntil && new Date() < states.openRouter.cooldownUntil;
    if (isCooling) {
      console.log(`[LLM] OpenRouter cooldown active until ${states.openRouter.cooldownUntil.toISOString()}`);
    } else {
      console.log('[LLM] OpenRouter available');
    }
  } else {
    console.warn('[LLM] OpenRouter API key missing');
  }
};

// Cooldown strategy triggers
function triggerCooldown(provider, error) {
  const status = error.response?.status;
  
  let cooldownMs = 5 * 60 * 1000; // default 5 minutes
  let reason = "unknown error";

  if (status === 429) {
    cooldownMs = 6 * 60 * 60 * 1000; // 6 hours
    reason = "429 quota exceeded / resource exhausted";
  } else if (status === 503) {
    cooldownMs = 15 * 60 * 1000; // 15 minutes
    reason = "503 service unavailable";
  } else if (status === 500 || status === 502 || status === 504) {
    cooldownMs = 5 * 60 * 1000; // 5 minutes
    reason = `${status} server error`;
  } else if (status === 401 || status === 403) {
    cooldownMs = 24 * 60 * 60 * 1000; // 24 hours (Invalid API key)
    reason = `${status} authentication error (invalid API key)`;
  } else if (!error.response) {
    cooldownMs = 5 * 60 * 1000; // 5 minutes
    reason = "network failure / timeout";
  }

  const cooldownUntil = new Date(Date.now() + cooldownMs);
  
  states[provider] = {
    status: "COOLDOWN",
    lastFailureAt: new Date(),
    failureReason: reason,
    cooldownUntil
  };
  
  console.error(`[LLM] [CircuitBreaker] ${provider} entered COOLDOWN until ${cooldownUntil.toISOString()}. Reason: ${reason}`);
}

// Check provider availability with auto recovery check
function isProviderAvailable(provider) {
  const state = states[provider];
  if (state.status === "COOLDOWN") {
    const now = new Date();
    if (now >= state.cooldownUntil) {
      console.log(`[LLM] [CircuitBreaker] ${provider} cooldown expired. Attempting single test recovery request.`);
      return true;
    }
    return false;
  }
  return true;
}

// Formats unified messages format into Gemini REST schema
function toGeminiMessages(messages) {
  return messages.map(m => {
    if (m.role === 'user') {
      return { role: 'user', parts: [{ text: m.content }] };
    } else if (m.role === 'assistant') {
      const parts = [];
      if (m.content) {
        parts.push({ text: m.content });
      }
      if (m.toolCalls && m.toolCalls.length > 0) {
        m.toolCalls.forEach(tc => {
          parts.push({
            functionCall: {
              name: tc.name,
              args: tc.args
            }
          });
        });
      }
      return { role: 'model', parts };
    } else if (m.role === 'tool') {
      return {
        role: 'function',
        parts: [
          {
            functionResponse: {
              name: m.name,
              response: m.content
            }
          }
        ]
      };
    }
    return null;
  }).filter(Boolean);
}

// Formats unified messages format into OpenRouter/OpenAI schema
function toOpenRouterMessages(systemInstruction, messages) {
  const routerMsgs = [];
  if (systemInstruction) {
    routerMsgs.push({ role: 'system', content: systemInstruction });
  }
  messages.forEach(m => {
    if (m.role === 'user') {
      routerMsgs.push({ role: 'user', content: m.content });
    } else if (m.role === 'assistant') {
      const routerMsg = { role: 'assistant', content: m.content || null };
      if (m.toolCalls && m.toolCalls.length > 0) {
        routerMsg.tool_calls = m.toolCalls.map((tc, idx) => ({
          id: `call_${idx}_${tc.name}`,
          type: 'function',
          function: {
            name: tc.name,
            arguments: typeof tc.args === 'string' ? tc.args : JSON.stringify(tc.args)
          }
        }));
      }
      routerMsgs.push(routerMsg);
    } else if (m.role === 'tool') {
      routerMsgs.push({
        role: 'tool',
        tool_call_id: `call_0_${m.name}`,
        name: m.name,
        content: typeof m.content === 'string' ? m.content : JSON.stringify(m.content)
      });
    }
  });
  return routerMsgs;
}

// Converts Gemini tools structure to OpenAI format for OpenRouter
function toOpenRouterTools(geminiTools) {
  if (!geminiTools || !geminiTools[0] || !geminiTools[0].functionDeclarations) {
    return undefined;
  }
  return geminiTools[0].functionDeclarations.map(fd => ({
    type: 'function',
    function: {
      name: fd.name,
      description: fd.description,
      parameters: fd.parameters
    }
  }));
}

// Parse Gemini completions response
function parseGeminiResponse(response) {
  const candidate = response.data.candidates?.[0];
  const parts = candidate?.content?.parts || [];
  
  const textPart = parts.find(p => p.text);
  const text = textPart ? textPart.text : '';
  
  const functionCalls = parts.filter(p => p.functionCall);
  let toolCalls = null;
  if (functionCalls.length > 0) {
    toolCalls = functionCalls.map(p => ({
      name: p.functionCall.name,
      args: p.functionCall.args
    }));
  }
  
  return { text, toolCalls };
}

// Parse OpenRouter completions response
function parseOpenRouterResponse(response) {
  const choice = response.data.choices?.[0];
  const message = choice?.message;
  const text = message?.content || '';
  
  let toolCalls = null;
  if (message?.tool_calls && message.tool_calls.length > 0) {
    toolCalls = message.tool_calls.map(tc => {
      let args = {};
      try {
        args = typeof tc.function.arguments === 'string' 
          ? JSON.parse(tc.function.arguments) 
          : tc.function.arguments;
      } catch (e) {
        console.error("[LLM] Failed to parse OpenRouter tool arguments:", tc.function.arguments, e);
      }
      return {
        name: tc.function.name,
        args
      };
    });
  }
  
  return { text, toolCalls };
}

// Retryable request runner for Gemini
async function runGeminiRequest(payload, attempt = 1) {
  const apiKey = process.env.GEMINI_API_KEY;
  const geminiUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  try {
    const response = await axios.post(geminiUrl, payload);
    return response;
  } catch (error) {
    const status = error.response?.status;
    const retryableStatuses = [429, 500, 502, 503, 504];
    
    if (attempt < 3 && retryableStatuses.includes(status)) {
      const delay = Math.pow(2, attempt) * 1000;
      console.warn(`[LLM] Gemini attempt ${attempt} failed with status ${status}. Retrying in ${delay}ms...`);
      await wait(delay);
      return runGeminiRequest(payload, attempt + 1);
    }
    throw error;
  }
}

// Call primary Gemini provider
export const callGemini = async ({ systemInstruction, messages, tools }) => {
  const payload = {
    contents: toGeminiMessages(messages),
    systemInstruction: systemInstruction ? {
      parts: [{ text: systemInstruction }]
    } : undefined,
    tools: tools
  };
  
  try {
    const response = await runGeminiRequest(payload);
    
    // Auto Recovery Check: Reset status to ACTIVE if successful
    if (states.gemini.status === "COOLDOWN") {
      console.log(`[LLM] [CircuitBreaker] Gemini successfully recovered. Resetting status to ACTIVE.`);
    }
    
    states.gemini = {
      status: "ACTIVE",
      lastFailureAt: null,
      failureReason: null,
      cooldownUntil: null
    };
    stats.gemini.successCount++;
    return parseGeminiResponse(response);
  } catch (error) {
    stats.gemini.failureCount++;
    triggerCooldown("gemini", error);
    throw error;
  }
};

// Call fallback OpenRouter provider
export const callOpenRouter = async ({ systemInstruction, messages, tools }) => {
  const apiKey = process.env.OPENROUTER_API_KEY;
  const model = process.env.OPENROUTER_MODEL || 'deepseek/deepseek-chat-v3-0324';
  const openRouterUrl = 'https://openrouter.ai/api/v1/chat/completions';
  
  const payload = {
    model,
    messages: toOpenRouterMessages(systemInstruction, messages),
    tools: toOpenRouterTools(tools)
  };
  
  try {
    const response = await axios.post(openRouterUrl, payload, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
    
    // Auto Recovery Check
    if (states.openRouter.status === "COOLDOWN") {
      console.log(`[LLM] [CircuitBreaker] OpenRouter successfully recovered. Resetting status to ACTIVE.`);
    }
    
    states.openRouter = {
      status: "ACTIVE",
      lastFailureAt: null,
      failureReason: null,
      cooldownUntil: null
    };
    stats.openRouter.successCount++;
    return parseOpenRouterResponse(response);
  } catch (error) {
    stats.openRouter.failureCount++;
    triggerCooldown("openRouter", error);
    throw error;
  }
};

// Central LLM call router with Circuit Breaker support
export const callLLM = async ({ systemInstruction, messages, tools }) => {
  const hasGeminiKey = !!process.env.GEMINI_API_KEY;
  const isGeminiAvailable = hasGeminiKey && isProviderAvailable("gemini");
  
  if (isGeminiAvailable) {
    console.log('[LLM] Using Gemini');
    try {
      const result = await callGemini({ systemInstruction, messages, tools });
      return result;
    } catch (err) {
      console.error('[LLM] Gemini request failed:', err.message);
    }
  } else {
    if (hasGeminiKey) {
      console.log(`[LLM] Gemini cooling down. Cooldown until ${states.gemini.cooldownUntil?.toISOString()}`);
      console.log('[LLM] Using OpenRouter immediately');
    } else {
      console.warn('[LLM] Skipping Gemini: API Key is not configured');
    }
  }

  // Fallback to OpenRouter
  const hasOpenRouterKey = !!process.env.OPENROUTER_API_KEY;
  const isOpenRouterAvailable = hasOpenRouterKey && isProviderAvailable("openRouter");

  if (isOpenRouterAvailable) {
    try {
      const result = await callOpenRouter({ systemInstruction, messages, tools });
      console.log('[LLM] OpenRouter success');
      return result;
    } catch (err) {
      console.error('[LLM] OpenRouter request failed:', err.message);
      console.error('[LLM] All providers failed');
      throw err;
    }
  } else {
    if (hasOpenRouterKey) {
      console.error(`[LLM] OpenRouter is cooling down. Cooldown until ${states.openRouter.cooldownUntil?.toISOString()}`);
    } else {
      console.error('[LLM] OpenRouter API key missing');
    }
    console.error('[LLM] All providers failed');
    throw new Error('All LLM providers failed and no active API keys/available channels exist');
  }
};
