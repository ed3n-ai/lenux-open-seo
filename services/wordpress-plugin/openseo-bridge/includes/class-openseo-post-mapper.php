<?php

if (!defined('ABSPATH')) {
    exit;
}

final class OpenSEO_Post_Mapper
{
    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    public static function upsert(array $payload): array|WP_Error
    {
        $external_id = sanitize_text_field((string) ($payload['external_id'] ?? ''));
        if ($external_id === '') {
            return new WP_Error('openseo_external_id_missing', 'external_id is required.', ['status' => 400]);
        }

        $post_type = self::post_type($payload['post_type'] ?? 'post');
        $status = self::post_status($payload['status'] ?? 'draft');
        $existing_id = self::find_existing_post($external_id);
        $scheduled_at = sanitize_text_field((string) ($payload['scheduled_at'] ?? ''));

        $post_data = [
            'ID' => $existing_id ?: 0,
            'post_content' => wp_kses_post((string) ($payload['content_html'] ?? '')),
            'post_excerpt' => sanitize_textarea_field((string) ($payload['excerpt'] ?? '')),
            'post_name' => sanitize_title((string) ($payload['slug'] ?? '')),
            'post_status' => $status,
            'post_title' => sanitize_text_field((string) ($payload['title'] ?? '')),
            'post_type' => $post_type,
        ];

        if ($scheduled_at !== '') {
            $timestamp = strtotime($scheduled_at);
            if ($timestamp !== false) {
                $post_data['post_date'] = gmdate('Y-m-d H:i:s', $timestamp);
                $post_data['post_date_gmt'] = gmdate('Y-m-d H:i:s', $timestamp);
            }
        }

        $post_id = wp_insert_post(
            $post_data,
            true
        );

        if (is_wp_error($post_id)) {
            return $post_id;
        }

        update_post_meta($post_id, '_openseo_external_id', $external_id);
        self::assign_terms($post_id, (array) ($payload['categories'] ?? []), 'category');
        self::assign_terms($post_id, (array) ($payload['tags'] ?? []), 'post_tag');
        OpenSEO_Yoast_Adapter::save($post_id, self::yoast_payload($payload));

        return [
            'ok' => true,
            'post_id' => $post_id,
            'status' => get_post_status($post_id),
            'edit_url' => get_edit_post_link($post_id, 'raw'),
            'updated_existing' => $existing_id > 0,
        ];
    }

    /**
     * @param array<string, mixed> $payload
     * @return array<string, mixed>
     */
    private static function yoast_payload(array $payload): array
    {
        if (isset($payload['yoast']) && is_array($payload['yoast'])) {
            return $payload['yoast'];
        }

        if (isset($payload['seo']) && is_array($payload['seo'])) {
            return $payload['seo'];
        }

        return [];
    }

    private static function find_existing_post(string $external_id): int
    {
        $query = new WP_Query(
            [
                'fields' => 'ids',
                'meta_key' => '_openseo_external_id',
                'meta_value' => $external_id,
                'post_status' => ['draft', 'pending', 'publish', 'private'],
                'post_type' => ['post', 'page'],
                'posts_per_page' => 1,
            ]
        );

        return isset($query->posts[0]) ? (int) $query->posts[0] : 0;
    }

    /**
     * @param mixed $value
     */
    private static function post_type($value): string
    {
        return $value === 'page' ? 'page' : 'post';
    }

    /**
     * @param mixed $value
     */
    private static function post_status($value): string
    {
        return $value === 'pending' ? 'pending' : 'draft';
    }

    /**
     * @param array<int, mixed> $terms
     */
    private static function assign_terms(int $post_id, array $terms, string $taxonomy): void
    {
        $clean_terms = array_values(
            array_filter(
                array_map(
                    static fn ($term): string => sanitize_text_field((string) $term),
                    $terms
                )
            )
        );

        if ($clean_terms === []) {
            return;
        }

        wp_set_object_terms($post_id, $clean_terms, $taxonomy, false);
    }
}
