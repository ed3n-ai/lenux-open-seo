<?php

if (!defined('ABSPATH')) {
    exit;
}

final class OpenSEO_Auth
{
    public static function can_write(WP_REST_Request $request): bool|WP_Error
    {
        $secret = trim((string) get_option('openseo_bridge_secret', ''));
        if ($secret === '') {
            return new WP_Error(
                'openseo_secret_missing',
                'OpenSEO Bridge secret is not configured.',
                ['status' => 403]
            );
        }

        $provided = (string) $request->get_header('x-openseo-secret');
        if ($provided === '' || !hash_equals($secret, $provided)) {
            return new WP_Error(
                'openseo_secret_invalid',
                'OpenSEO Bridge secret is invalid.',
                ['status' => 401]
            );
        }

        return true;
    }
}
