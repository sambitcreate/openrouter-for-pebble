// Get query parameters
function getQueryParam(param) {
  var query = location.search.substring(1);
  var vars = query.split('&');
  for (var i = 0; i < vars.length; i++) {
    var pair = vars[i].split('=');
    if (decodeURIComponent(pair[0]) == param) {
      return decodeURIComponent(pair[1]);
    }
  }
  return null;
}

// Provider-specific defaults
var providerDefaults = {
  claude: {
    base_url: 'https://api.anthropic.com/v1/messages',
    model: 'claude-haiku-4-5',
    name: 'Claude'
  },
  openai: {
    base_url: 'https://api.openai.com/v1/chat/completions',
    model: 'gpt-4o-mini',
    name: 'ChatGPT'
  },
  openrouter: {
    base_url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'anthropic/claude-3.5-haiku',
    name: 'OpenRouter'
  },
  grok: {
    base_url: 'https://api.x.ai/v1/chat/completions',
    model: 'grok-2-latest',
    name: 'Grok'
  },
  custom: {
    base_url: '',
    model: '',
    name: 'Custom AI'
  }
};

// Default system message
var defaultSystemMessage = "You're running on a Pebble smartwatch. Please respond in plain text without any formatting, keeping your responses within 1-3 sentences.";

// Load existing settings
var provider = getQueryParam('provider') || 'claude';
var providerName = getQueryParam('provider_name');
var apiKey = getQueryParam('api_key');
var baseUrl = getQueryParam('base_url');
var model = getQueryParam('model');
var systemMessage = getQueryParam('system_message');
var webSearchEnabled = getQueryParam('web_search_enabled');

// Get return_to for emulator support (falls back to pebblejs://close# for real hardware)
var returnTo = getQueryParam('return_to') || 'pebblejs://close#';

// Initialize form when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  var providerSelect = document.getElementById('provider');
  var providerNameInput = document.getElementById('provider-name');
  var apiKeyInput = document.getElementById('api-key');
  var baseUrlInput = document.getElementById('base-url');
  var modelInput = document.getElementById('model');
  var systemMessageInput = document.getElementById('system-message');
  var webSearchCheckbox = document.getElementById('web-search');
  var advancedRows = document.querySelectorAll('.advanced-field');
  var customEndpointFields = document.querySelectorAll('.custom-endpoint-field');
  var claudeOnlyFields = document.querySelectorAll('.claude-only-field');

  // Set form values
  providerSelect.value = provider;
  providerNameInput.value = providerName || providerDefaults[provider].name;
  if (apiKey) {
    apiKeyInput.value = apiKey;
  }
  baseUrlInput.value = baseUrl || providerDefaults[provider].base_url;
  modelInput.value = model || providerDefaults[provider].model;
  systemMessageInput.value = systemMessage || defaultSystemMessage;
  webSearchCheckbox.checked = webSearchEnabled === 'true';

  // Function to update form based on provider
  function updateProviderFields() {
    var selectedProvider = providerSelect.value;
    var defaults = providerDefaults[selectedProvider];

    // Update default values
    if (!providerNameInput.value || providerNameInput.value === providerDefaults[provider].name) {
      providerNameInput.value = defaults.name;
    }
    baseUrlInput.value = defaults.base_url;
    modelInput.value = defaults.model;
    baseUrlInput.placeholder = defaults.base_url || 'https://api.example.com/v1/chat/completions';
    modelInput.placeholder = defaults.model || 'model-name';

    // Show/hide endpoint field for custom provider
    customEndpointFields.forEach(function(field) {
      field.style.display = (selectedProvider === 'custom') ? '' : 'none';
    });

    // Show/hide Claude-only features
    claudeOnlyFields.forEach(function(field) {
      field.style.display = (selectedProvider === 'claude') ? '' : 'none';
    });
  }

  // Function to toggle advanced fields visibility
  function toggleAdvancedFields() {
    var hasApiKey = apiKeyInput.value.trim() !== '';
    advancedRows.forEach(function(row) {
      row.style.display = hasApiKey ? '' : 'none';
    });
    // Re-apply provider-specific visibility
    updateProviderFields();
  }

  // Initial setup
  toggleAdvancedFields();
  updateProviderFields();

  // Listen for provider changes
  providerSelect.addEventListener('change', function() {
    provider = providerSelect.value;
    updateProviderFields();
  });

  // Listen for API key changes
  apiKeyInput.addEventListener('input', toggleAdvancedFields);

  // Save button handler
  document.getElementById('save-button').addEventListener('click', function() {
    var settings = {
      provider: providerSelect.value,
      provider_name: providerNameInput.value.trim(),
      api_key: apiKeyInput.value.trim(),
      base_url: baseUrlInput.value.trim(),
      model: modelInput.value.trim(),
      system_message: systemMessageInput.value.trim(),
      web_search_enabled: webSearchCheckbox.checked.toString()
    };

    // Send settings back to Pebble (works for both emulator and real hardware)
    var url = returnTo + encodeURIComponent(JSON.stringify(settings));
    document.location = url;
  });

  // Reset button handler
  document.getElementById('reset-button').addEventListener('click', function() {
    // Reset to default provider
    providerSelect.value = 'claude';
    provider = 'claude';
    var defaults = providerDefaults['claude'];

    // Clear all form fields
    providerNameInput.value = defaults.name;
    apiKeyInput.value = '';
    baseUrlInput.value = defaults.base_url;
    modelInput.value = defaults.model;
    systemMessageInput.value = defaultSystemMessage;
    webSearchCheckbox.checked = false;

    // Toggle advanced fields visibility
    toggleAdvancedFields();

    // Send empty settings back to Pebble to clear localStorage
    var settings = {
      provider: 'claude',
      provider_name: defaults.name,
      api_key: '',
      base_url: defaults.base_url,
      model: defaults.model,
      system_message: defaultSystemMessage,
      web_search_enabled: 'false'
    };

    var url = returnTo + encodeURIComponent(JSON.stringify(settings));
    document.location = url;
  });
});
