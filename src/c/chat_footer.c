#include "chat_footer.h"
#include "ai_spark.h"
#include <string.h>

#define SPARK_SIZE 25
#define PADDING 10
#define TEXT_FONT FONT_KEY_GOTHIC_14

struct ChatFooter {
  Layer *layer;
  AISparkLayer *spark;
  TextLayer *text_layer;
  char *disclaimer_text;
  int height;
};

ChatFooter* chat_footer_create(int width, const char *provider_name) {
  ChatFooter *footer = malloc(sizeof(ChatFooter));
  if (!footer) {
    return NULL;
  }

  // Create disclaimer text
  const char *name = provider_name ? provider_name : "AI";
  size_t text_len = strlen(name) + 32;  // Room for " can make\nmistakes."
  footer->disclaimer_text = malloc(text_len);
  if (!footer->disclaimer_text) {
    free(footer);
    return NULL;
  }
  snprintf(footer->disclaimer_text, text_len, "%s\ncan make\nmistakes.", name);

  // Calculate text dimensions
  int text_x = PADDING + SPARK_SIZE + PADDING;
  int text_width = width - text_x - PADDING;

  GFont font = fonts_get_system_font(TEXT_FONT);
  GSize text_size = graphics_text_layout_get_content_size(
    footer->disclaimer_text,
    font,
    GRect(0, 0, text_width, 100),
    GTextOverflowModeWordWrap,
    GTextAlignmentLeft
  );

  // Calculate footer height dynamically (no top padding)
  int content_height = text_size.h > SPARK_SIZE ? text_size.h : SPARK_SIZE;
  footer->height = content_height + PADDING;

  // Create container layer
  footer->layer = layer_create(GRect(0, 0, width, footer->height));

  // Create small Claude spark on the left (vertically centered in content area)
  int spark_y = (content_height - SPARK_SIZE) / 2;
  footer->spark = ai_spark_layer_create(
    GRect(PADDING, spark_y, SPARK_SIZE, SPARK_SIZE),
    AI_SPARK_SMALL
  );
  ai_spark_set_frame(footer->spark, 3);  // Static on frame 4
  layer_add_child(footer->layer, ai_spark_get_layer(footer->spark));

  // Create disclaimer text on the right (vertically centered in content area)
  int text_y = (content_height - text_size.h) / 2;
  footer->text_layer = text_layer_create(GRect(text_x, text_y, text_width, text_size.h));
  text_layer_set_text(footer->text_layer, footer->disclaimer_text);
  text_layer_set_font(footer->text_layer, fonts_get_system_font(TEXT_FONT));
  text_layer_set_text_alignment(footer->text_layer, GTextAlignmentLeft);
  text_layer_set_text_color(footer->text_layer, GColorDarkGray);
  text_layer_set_background_color(footer->text_layer, GColorClear);
  layer_add_child(footer->layer, text_layer_get_layer(footer->text_layer));

  return footer;
}

void chat_footer_destroy(ChatFooter *footer) {
  if (!footer) {
    return;
  }

  if (footer->text_layer) {
    text_layer_destroy(footer->text_layer);
  }

  if (footer->spark) {
    ai_spark_layer_destroy(footer->spark);
  }

  if (footer->layer) {
    layer_destroy(footer->layer);
  }

  if (footer->disclaimer_text) {
    free(footer->disclaimer_text);
  }

  free(footer);
}

Layer* chat_footer_get_layer(ChatFooter *footer) {
  return footer ? footer->layer : NULL;
}

void chat_footer_start_animation(ChatFooter *footer) {
  if (footer && footer->spark) {
    ai_spark_start_animation(footer->spark);
  }
}

void chat_footer_stop_animation(ChatFooter *footer) {
  if (footer && footer->spark) {
    ai_spark_stop_animation(footer->spark);
    ai_spark_set_frame(footer->spark, 3);  // Back to frame 4
  }
}

int chat_footer_get_height(ChatFooter *footer) {
  return footer ? footer->height : 0;
}
