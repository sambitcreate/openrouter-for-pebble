#include "ai_spark.h"

// Global state - PDC sequences loaded once
static GDrawCommandSequence *s_small_sequence = NULL;
static GDrawCommandSequence *s_large_sequence = NULL;

// Individual spark layer instance
struct AISparkLayer {
  Layer *layer;
  AppTimer *timer;
  int frame_index;
  bool is_animating;
  AISparkSize size;
};

// Forward declarations
static void update_proc(Layer *layer, GContext *ctx);
static void next_frame_handler(void *context);
static GDrawCommandSequence* get_sequence_for_size(AISparkSize size);

void ai_spark_init(void) {
  // Load both PDC sequences
  s_small_sequence = gdraw_command_sequence_create_with_resource(RESOURCE_ID_AI_S);
  s_large_sequence = gdraw_command_sequence_create_with_resource(RESOURCE_ID_AI_L);

  if (!s_small_sequence || !s_large_sequence) {
    APP_LOG(APP_LOG_LEVEL_ERROR, "Failed to load AI spark sequences!");
    return;
  }

#ifndef PBL_COLOR
  // Override colors to black on B/W watches only
  GDrawCommandSequence *sequences[] = {s_small_sequence, s_large_sequence};
  for (int s = 0; s < 2; s++) {
    GDrawCommandSequence *seq = sequences[s];
    int num_frames = gdraw_command_sequence_get_num_frames(seq);

    for (int f = 0; f < num_frames; f++) {
      GDrawCommandFrame *frame = gdraw_command_sequence_get_frame_by_index(seq, f);
      GDrawCommandList *command_list = gdraw_command_frame_get_command_list(frame);
      uint32_t num_commands = gdraw_command_list_get_num_commands(command_list);

      for (uint32_t i = 0; i < num_commands; i++) {
        GDrawCommand *command = gdraw_command_list_get_command(command_list, i);
        gdraw_command_set_fill_color(command, GColorBlack);
      }
    }
  }
#endif

  APP_LOG(APP_LOG_LEVEL_INFO, "AI spark sequences loaded successfully");
}

void ai_spark_deinit(void) {
  if (s_small_sequence) {
    gdraw_command_sequence_destroy(s_small_sequence);
    s_small_sequence = NULL;
  }
  if (s_large_sequence) {
    gdraw_command_sequence_destroy(s_large_sequence);
    s_large_sequence = NULL;
  }
}

AISparkLayer* ai_spark_layer_create(GRect frame, AISparkSize size) {
  AISparkLayer *spark = malloc(sizeof(AISparkLayer));
  if (!spark) {
    return NULL;
  }

  spark->layer = layer_create_with_data(frame, sizeof(AISparkLayer*));
  spark->timer = NULL;
  spark->frame_index = 0;
  spark->is_animating = false;
  spark->size = size;

  layer_set_update_proc(spark->layer, update_proc);
  *((AISparkLayer**)layer_get_data(spark->layer)) = spark;

  return spark;
}

void ai_spark_layer_destroy(AISparkLayer *spark) {
  if (!spark) {
    return;
  }

  if (spark->timer) {
    app_timer_cancel(spark->timer);
  }

  if (spark->layer) {
    layer_destroy(spark->layer);
  }

  free(spark);
}

Layer* ai_spark_get_layer(AISparkLayer *spark) {
  return spark ? spark->layer : NULL;
}

void ai_spark_start_animation(AISparkLayer *spark) {
  if (!spark || spark->is_animating) {
    return;
  }

  spark->is_animating = true;
  spark->frame_index = 0;

  // Schedule first frame
  GDrawCommandSequence *seq = get_sequence_for_size(spark->size);
  GDrawCommandFrame *frame = gdraw_command_sequence_get_frame_by_index(seq, 0);
  uint16_t duration = gdraw_command_frame_get_duration(frame);

  layer_mark_dirty(spark->layer);
  spark->timer = app_timer_register(duration, next_frame_handler, spark);
}

void ai_spark_stop_animation(AISparkLayer *spark) {
  if (!spark) {
    return;
  }

  spark->is_animating = false;

  if (spark->timer) {
    app_timer_cancel(spark->timer);
    spark->timer = NULL;
  }
}

void ai_spark_set_frame(AISparkLayer *spark, int frame_index) {
  if (!spark) {
    return;
  }

  ai_spark_stop_animation(spark);

  GDrawCommandSequence *seq = get_sequence_for_size(spark->size);
  int num_frames = gdraw_command_sequence_get_num_frames(seq);

  spark->frame_index = frame_index % num_frames;
  layer_mark_dirty(spark->layer);
}

void ai_spark_set_size(AISparkLayer *spark, AISparkSize size) {
  if (!spark) {
    return;
  }

  bool was_animating = spark->is_animating;
  ai_spark_stop_animation(spark);

  spark->size = size;
  layer_mark_dirty(spark->layer);

  if (was_animating) {
    ai_spark_start_animation(spark);
  }
}

bool ai_spark_is_animating(AISparkLayer *spark) {
  return spark ? spark->is_animating : false;
}

// Private helper functions

static GDrawCommandSequence* get_sequence_for_size(AISparkSize size) {
  return (size == AI_SPARK_SMALL) ? s_small_sequence : s_large_sequence;
}

static void update_proc(Layer *layer, GContext *ctx) {
  AISparkLayer *spark = *((AISparkLayer**)layer_get_data(layer));
  if (!spark) {
    return;
  }

  GRect bounds = layer_get_bounds(layer);
  GDrawCommandSequence *seq = get_sequence_for_size(spark->size);
  GSize seq_bounds = gdraw_command_sequence_get_bounds_size(seq);

  // Get the current frame
  GDrawCommandFrame *frame = gdraw_command_sequence_get_frame_by_index(seq, spark->frame_index);

  // Draw centered in the layer
  if (frame) {
    gdraw_command_frame_draw(ctx, seq, frame, GPoint(
      (bounds.size.w - seq_bounds.w) / 2,
      (bounds.size.h - seq_bounds.h) / 2
    ));
  }
}

static void next_frame_handler(void *context) {
  AISparkLayer *spark = (AISparkLayer*)context;
  if (!spark || !spark->is_animating) {
    return;
  }

  GDrawCommandSequence *seq = get_sequence_for_size(spark->size);
  int num_frames = gdraw_command_sequence_get_num_frames(seq);

  // Advance to next frame
  spark->frame_index++;
  if (spark->frame_index >= num_frames) {
    spark->frame_index = 0;
  }

  // Redraw
  layer_mark_dirty(spark->layer);

  // Schedule next frame
  GDrawCommandFrame *frame = gdraw_command_sequence_get_frame_by_index(seq, spark->frame_index);
  uint16_t duration = gdraw_command_frame_get_duration(frame);
  spark->timer = app_timer_register(duration, next_frame_handler, spark);
}
