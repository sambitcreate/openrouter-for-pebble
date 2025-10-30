#pragma once
#include <pebble.h>

/**
 * Chat Footer Component
 *
 * Displays a small AI spark icon with disclaimer.
 * Shown at the bottom of the chat conversation.
 */

typedef struct ChatFooter ChatFooter;

/**
 * Create a new chat footer.
 * @param width Width of the footer (typically content area width)
 * @param provider_name Name of the AI provider to use in disclaimer
 * @return Pointer to the created footer
 */
ChatFooter* chat_footer_create(int width, const char *provider_name);

/**
 * Destroy a chat footer and free its resources.
 * @param footer The footer to destroy
 */
void chat_footer_destroy(ChatFooter *footer);

/**
 * Get the underlying Layer for adding to view hierarchy.
 * @param footer The chat footer
 * @return The Layer object
 */
Layer* chat_footer_get_layer(ChatFooter *footer);

/**
 * Start animating the Claude spark.
 * @param footer The chat footer
 */
void chat_footer_start_animation(ChatFooter *footer);

/**
 * Stop animating the Claude spark.
 * @param footer The chat footer
 */
void chat_footer_stop_animation(ChatFooter *footer);

/**
 * Get the height of the footer (for layout calculations).
 * @param footer The chat footer
 * @return Height in pixels
 */
int chat_footer_get_height(ChatFooter *footer);
