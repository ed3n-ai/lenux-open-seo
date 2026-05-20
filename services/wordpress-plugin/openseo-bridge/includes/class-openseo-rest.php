<?php

if (!defined('ABSPATH')) {
    exit;
}

final class OpenSEO_REST
{
    public static function register(): void
    {
        add_action('rest_api_init', static function (): void {
            register_rest_route(
                'openseo/v1',
                '/health',
                [
                    'methods' => WP_REST_Server::READABLE,
                    'permission_callback' => [OpenSEO_Auth::class, 'can_write'],
                    'callback' => [self::class, 'health'],
                ]
            );

            register_rest_route(
                'openseo/v1',
                '/posts/upsert',
                [
                    'methods' => WP_REST_Server::CREATABLE,
                    'permission_callback' => [OpenSEO_Auth::class, 'can_write'],
                    'callback' => [self::class, 'upsert_post'],
                ]
            );
        });
    }

    public static function health(WP_REST_Request $request): WP_REST_Response
    {
        return rest_ensure_response(
            [
                'ok' => true,
                'product' => 'Lenux28 SEO',
                'plugin_version' => OPENSEO_BRIDGE_VERSION,
                'site_url' => get_site_url(),
            ]
        );
    }

    public static function upsert_post(WP_REST_Request $request): WP_REST_Response|WP_Error
    {
        $payload = $request->get_json_params();
        if (!is_array($payload)) {
            return new WP_Error('openseo_payload_invalid', 'JSON payload is required.', ['status' => 400]);
        }

        $result = OpenSEO_Post_Mapper::upsert($payload);
        if (is_wp_error($result)) {
            return $result;
        }

        return rest_ensure_response($result);
    }
}
