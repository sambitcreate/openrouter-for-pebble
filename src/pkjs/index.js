// Parse encoded conversation string "[U]msg1[A]msg2..." into messages array
function parseConversation(encoded) {
  var messages = [];
  var parts = encoded.split(/(\[U\]|\[A\])/);

  var currentRole = null;
  for (var i = 0; i < parts.length; i++) {
    if (parts[i] === '[U]') {
      currentRole = 'user';
    } else if (parts[i] === '[A]') {
      currentRole = 'assistant';
    } else if (parts[i] && parts[i].length > 0 && currentRole) {
      messages.push({
        role: currentRole,
        content: parts[i]
      });
      currentRole = null;
    }
  }

  return messages;
}

// Get response from AI API
function getAIResponse(messages) {
  var provider = localStorage.getItem('provider') || 'claude';
  var providerName = localStorage.getItem('provider_name') || 'AI';
  var apiKey = localStorage.getItem('api_key');
  var baseUrl = localStorage.getItem('base_url');
  var model = localStorage.getItem('model');
  var systemMessage = localStorage.getItem('system_message') || "You're running on a Pebble smartwatch. Please respond in plain text without any formatting, keeping your responses within 1-3 sentences.";
  var webSearchEnabled = localStorage.getItem('web_search_enabled') === 'true';

  // Set provider-specific defaults if not configured
  if (!baseUrl) {
    if (provider === 'claude') baseUrl = 'https://api.anthropic.com/v1/messages';
    else if (provider === 'openai') baseUrl = 'https://api.openai.com/v1/chat/completions';
    else if (provider === 'openrouter') baseUrl = 'https://openrouter.ai/api/v1/chat/completions';
    else if (provider === 'grok') baseUrl = 'https://api.x.ai/v1/chat/completions';
  }

  if (!model) {
    if (provider === 'claude') model = 'claude-haiku-4-5';
    else if (provider === 'openai') model = 'gpt-4o-mini';
    else if (provider === 'openrouter') model = 'anthropic/claude-3.5-haiku';
    else if (provider === 'grok') model = 'grok-2-latest';
  }

  if (!apiKey) {
    console.log('No API key configured');
    Pebble.sendAppMessage({ 'RESPONSE_TEXT': 'No API key configured. Please configure in settings.' });
    Pebble.sendAppMessage({ 'RESPONSE_END': 1 });
    return;
  }

  console.log('Sending request to ' + providerName + ' API with ' + messages.length + ' messages');

  var xhr = new XMLHttpRequest();
  xhr.open('POST', baseUrl, true);
  xhr.setRequestHeader('Content-Type', 'application/json');

  // Set provider-specific headers
  if (provider === 'claude') {
    xhr.setRequestHeader('x-api-key', apiKey);
    xhr.setRequestHeader('anthropic-version', '2023-06-01');
  } else if (provider === 'openrouter') {
    xhr.setRequestHeader('Authorization', 'Bearer ' + apiKey);
    xhr.setRequestHeader('HTTP-Referer', 'https://github.com/breitburg/claude-for-pebble');
  } else {
    // OpenAI, Grok, and custom endpoints use Bearer token
    xhr.setRequestHeader('Authorization', 'Bearer ' + apiKey);
  }

  xhr.timeout = 5000;

  xhr.onload = function () {
    if (xhr.status === 200) {
      try {
        var data = JSON.parse(xhr.responseText);
        var responseText = '';

        // Parse response based on provider format
        if (provider === 'claude') {
          // Claude API format: content array with text blocks
          if (data.content && data.content.length > 0) {
            for (var i = 0; i < data.content.length; i++) {
              var block = data.content[i];
              if (block.type === 'text' && block.text) {
                responseText += block.text;
              } else if (block.type === 'server_tool_use') {
                responseText += '\n\n';
              }
            }
          }
        } else {
          // OpenAI/Grok/OpenRouter format: choices array with message.content
          if (data.choices && data.choices.length > 0 && data.choices[0].message) {
            responseText = data.choices[0].message.content || '';
          }
        }

        responseText = responseText.trim();

        if (responseText.length > 0) {
          console.log('Sending response: ' + responseText);
          Pebble.sendAppMessage({ 'RESPONSE_TEXT': responseText });
        } else {
          console.log('No text in response');
          Pebble.sendAppMessage({ 'RESPONSE_TEXT': 'No response from ' + providerName });
        }
      } catch (e) {
        console.log('Error parsing response: ' + e);
        Pebble.sendAppMessage({ 'RESPONSE_TEXT': 'Error parsing response' });
      }
    } else {
      console.log('API error: ' + xhr.status + ' - ' + xhr.responseText);
      // Parse error response and extract message
      var errorMessage = xhr.responseText;

      try {
        var errorData = JSON.parse(xhr.responseText);
        if (errorData.error && errorData.error.message) {
          errorMessage = errorData.error.message;
        }
      } catch (e) {
        console.log('Failed to parse error response: ' + e);
      }

      // Send error
      Pebble.sendAppMessage({ 'RESPONSE_TEXT': 'Error ' + xhr.status + ': ' + errorMessage });
    }

    // Always send end signal
    Pebble.sendAppMessage({ 'RESPONSE_END': 1 });
  };

  xhr.onerror = function () {
    console.log('Network error');
    Pebble.sendAppMessage({ 'RESPONSE_TEXT': 'Network error occurred' });
    Pebble.sendAppMessage({ 'RESPONSE_END': 1 });
  };

  xhr.ontimeout = function () {
    console.log('Request timeout');
    Pebble.sendAppMessage({ 'RESPONSE_TEXT': 'Request timed out. Try again later.' });
    Pebble.sendAppMessage({ 'RESPONSE_END': 1 });
  };

  var requestBody = {
    model: model,
    max_tokens: 256,
    messages: messages
  };

  // Provider-specific request body modifications
  if (provider === 'claude') {
    // Claude uses 'system' field separately
    if (systemMessage) {
      requestBody.system = systemMessage;
    }

    // Add web search tool if enabled (Claude only)
    if (webSearchEnabled) {
      requestBody.tools = [{
        type: 'web_search_20250305',
        name: 'web_search',
        max_uses: 5
      }];
    }
  } else {
    // OpenAI-style APIs: inject system message as first message
    if (systemMessage) {
      requestBody.messages = [{ role: 'system', content: systemMessage }].concat(messages);
    }
  }

  console.log('Request body: ' + JSON.stringify(requestBody));
  xhr.send(JSON.stringify(requestBody));
}

// Send ready status to watch
function sendReadyStatus() {
  var apiKey = localStorage.getItem('api_key');
  var isReady = apiKey && apiKey.trim().length > 0 ? 1 : 0;
  var providerName = localStorage.getItem('provider_name') || 'AI';

  console.log('Sending READY_STATUS: ' + isReady + ', PROVIDER_NAME: ' + providerName);
  Pebble.sendAppMessage({ 'READY_STATUS': isReady, 'PROVIDER_NAME': providerName });
}

// Listen for app ready
Pebble.addEventListener('ready', function () {
  console.log('PebbleKit JS ready');
  sendReadyStatus();
});

// Listen for messages from watch
Pebble.addEventListener('appmessage', function (e) {
  console.log('Received message from watch');

  if (e.payload.REQUEST_CHAT) {
    var encoded = e.payload.REQUEST_CHAT;
    console.log('REQUEST_CHAT received: ' + encoded);

    var messages = parseConversation(encoded);
    console.log('Parsed ' + messages.length + ' messages');

    getAIResponse(messages);
  }
});

// Listen for when the configuration page is opened
Pebble.addEventListener('showConfiguration', function () {
  // Get existing settings
  var provider = localStorage.getItem('provider') || '';
  var providerName = localStorage.getItem('provider_name') || '';
  var apiKey = localStorage.getItem('api_key') || '';
  var baseUrl = localStorage.getItem('base_url') || '';
  var model = localStorage.getItem('model') || '';
  var systemMessage = localStorage.getItem('system_message') || '';
  var webSearchEnabled = localStorage.getItem('web_search_enabled') || 'false';

  // Build configuration URL
  var url = 'https://breitburg.github.io/claude-for-pebble/config/';
  url += '?provider=' + encodeURIComponent(provider);
  url += '&provider_name=' + encodeURIComponent(providerName);
  url += '&api_key=' + encodeURIComponent(apiKey);
  url += '&base_url=' + encodeURIComponent(baseUrl);
  url += '&model=' + encodeURIComponent(model);
  url += '&system_message=' + encodeURIComponent(systemMessage);
  url += '&web_search_enabled=' + encodeURIComponent(webSearchEnabled);

  console.log('Opening configuration page: ' + url);
  Pebble.openURL(url);
});

// Listen for when the configuration page is closed
Pebble.addEventListener('webviewclosed', function (e) {
  if (e && e.response) {
    var settings = JSON.parse(decodeURIComponent(e.response));
    console.log('Settings received: ' + JSON.stringify(settings));

    // Save or clear settings in local storage
    var keys = ['provider', 'provider_name', 'api_key', 'base_url', 'model', 'system_message', 'web_search_enabled'];
    keys.forEach(function (key) {
      if (settings[key] && settings[key].trim() !== '') {
        localStorage.setItem(key, settings[key]);
        console.log(key + ' saved');
      } else {
        localStorage.removeItem(key);
        console.log(key + ' cleared');
      }
    });

    // Send updated ready status to watch
    sendReadyStatus();
  }
});
