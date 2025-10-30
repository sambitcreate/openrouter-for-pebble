#pragma once
#include <pebble.h>

/**
 * Setup Window - Displayed when API key is not configured
 *
 * Shows a centered message prompting the user to configure
 * Claude in the app settings.
 */

/**
 * Create the setup window.
 * @return Pointer to the created window
 */
Window* setup_window_create(void);

/**
 * Destroy the setup window and free its resources.
 * @param window The window to destroy
 */
void setup_window_destroy(Window *window);

/**
 * Set the provider name displayed in the setup window.
 * @param name The provider name to display
 */
void setup_window_set_provider_name(const char *name);
