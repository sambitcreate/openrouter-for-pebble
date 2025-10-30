#pragma once
#include <pebble.h>

/**
 * AI Spark Animation Component
 *
 * Provides reusable AI spark animation that can be placed anywhere in the UI.
 * Supports two sizes (large/small) and animation control (play/pause/freeze).
 */

typedef enum {
  AI_SPARK_SMALL,
  AI_SPARK_LARGE
} AISparkSize;

typedef struct AISparkLayer AISparkLayer;

/**
 * Initialize the AI Spark system (loads PDC resources).
 * Call this once during app initialization.
 */
void ai_spark_init(void);

/**
 * Deinitialize the AI Spark system (frees PDC resources).
 * Call this once during app deinitialization.
 */
void ai_spark_deinit(void);

/**
 * Create a new AI Spark layer.
 * @param frame The position and size of the layer
 * @param size The size variant (SMALL or LARGE)
 * @return Pointer to the created spark layer
 */
AISparkLayer* ai_spark_layer_create(GRect frame, AISparkSize size);

/**
 * Destroy a AI Spark layer and free its resources.
 * @param spark The spark layer to destroy
 */
void ai_spark_layer_destroy(AISparkLayer *spark);

/**
 * Get the underlying Layer for adding to the view hierarchy.
 * @param spark The spark layer
 * @return The Layer object
 */
Layer* ai_spark_get_layer(AISparkLayer *spark);

/**
 * Start animating the spark (loops through all frames).
 * @param spark The spark layer
 */
void ai_spark_start_animation(AISparkLayer *spark);

/**
 * Stop the animation and freeze on the current frame.
 * @param spark The spark layer
 */
void ai_spark_stop_animation(AISparkLayer *spark);

/**
 * Set the spark to display a specific frame (and stop animation).
 * @param spark The spark layer
 * @param frame_index The frame index (0-based)
 */
void ai_spark_set_frame(AISparkLayer *spark, int frame_index);

/**
 * Change the size of the spark (switches between large/small PDC).
 * @param spark The spark layer
 * @param size The new size
 */
void ai_spark_set_size(AISparkLayer *spark, AISparkSize size);

/**
 * Check if the spark is currently animating.
 * @param spark The spark layer
 * @return true if animating, false otherwise
 */
bool ai_spark_is_animating(AISparkLayer *spark);
