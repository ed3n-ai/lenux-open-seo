<?php

if (!defined('ABSPATH')) {
    exit;
}

final class OpenSEO_Yoast_Adapter
{
    /**
     * @param array<string, mixed> $seo
     */
    public static function save(int $post_id, array $seo): void
    {
        self::update_if_present($post_id, '_yoast_wpseo_title', self::field($seo, 'seo_title', 'meta_title'));
        self::update_if_present($post_id, '_yoast_wpseo_metadesc', self::field($seo, 'meta_description'));
        self::update_if_present($post_id, '_yoast_wpseo_focuskw', self::field($seo, 'focus_keyphrase', 'focus_keyword'));
        self::update_if_present($post_id, '_yoast_wpseo_canonical', self::field($seo, 'canonical'));
        self::update_if_present($post_id, '_yoast_wpseo_meta-robots-noindex', self::robots_value($seo, 'noindex'));
        self::update_if_present($post_id, '_yoast_wpseo_meta-robots-nofollow', self::robots_value($seo, 'nofollow'));
    }

    /**
     * @param array<string, mixed> $seo
     */
    private static function field(array $seo, string $key, ?string $fallback = null): string
    {
        $value = $seo[$key] ?? ($fallback ? ($seo[$fallback] ?? '') : '');
        return is_scalar($value) ? (string) $value : '';
    }

    /**
     * @param array<string, mixed> $seo
     */
    private static function robots_value(array $seo, string $needle): string
    {
        $robots = self::field($seo, 'robots');
        return str_contains(strtolower($robots), $needle) ? '1' : '';
    }

    private static function update_if_present(int $post_id, string $key, string $value): void
    {
        $clean = trim(wp_unslash($value));
        if ($clean === '') {
            return;
        }

        update_post_meta($post_id, $key, sanitize_text_field($clean));
    }
}
