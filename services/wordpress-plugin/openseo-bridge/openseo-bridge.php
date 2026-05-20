<?php
/**
 * Plugin Name: Lenux28 SEO Bridge
 * Description: Receives prepared Lenux28 SEO drafts and creates WordPress drafts with Yoast SEO fields.
 * Version: 0.2.0
 * Author: Lenux28 SEO
 * License: MIT
 */

if (!defined('ABSPATH')) {
    exit;
}

define('OPENSEO_BRIDGE_VERSION', '0.2.0');
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
