<?php
/**
 * Plugin Name: OpenSEO Bridge
 * Description: Receives prepared OpenSEO drafts and creates WordPress drafts with Yoast SEO fields.
 * Version: 0.1.0
 * Author: OpenSEO
 * License: MIT
 */

if (!defined('ABSPATH')) {
    exit;
}

define('OPENSEO_BRIDGE_VERSION', '0.1.0');
define('OPENSEO_BRIDGE_PATH', plugin_dir_path(__FILE__));

require_once OPENSEO_BRIDGE_PATH . 'includes/class-openseo-auth.php';
require_once OPENSEO_BRIDGE_PATH . 'includes/class-openseo-yoast-adapter.php';
require_once OPENSEO_BRIDGE_PATH . 'includes/class-openseo-post-mapper.php';
require_once OPENSEO_BRIDGE_PATH . 'includes/class-openseo-rest.php';
require_once OPENSEO_BRIDGE_PATH . 'includes/class-openseo-settings.php';

add_action('plugins_loaded', static function (): void {
    OpenSEO_Settings::register();
    OpenSEO_REST::register();
});
