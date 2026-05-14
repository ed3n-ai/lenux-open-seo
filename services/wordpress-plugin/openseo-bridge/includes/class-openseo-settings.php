<?php

if (!defined('ABSPATH')) {
    exit;
}

final class OpenSEO_Settings
{
    public static function register(): void
    {
        add_action('admin_init', [self::class, 'register_setting']);
        add_action('admin_menu', [self::class, 'register_page']);
    }

    public static function register_setting(): void
    {
        register_setting(
            'openseo_bridge',
            'openseo_bridge_secret',
            [
                'sanitize_callback' => 'sanitize_text_field',
                'type' => 'string',
            ]
        );
    }

    public static function register_page(): void
    {
        add_options_page(
            'OpenSEO Bridge',
            'OpenSEO Bridge',
            'manage_options',
            'openseo-bridge',
            [self::class, 'render_page']
        );
    }

    public static function render_page(): void
    {
        if (!current_user_can('manage_options')) {
            return;
        }
        ?>
        <div class="wrap">
            <h1>OpenSEO Bridge</h1>
            <p>Configure the shared secret used by OpenSEO when sending drafts to WordPress.</p>
            <form method="post" action="options.php">
                <?php settings_fields('openseo_bridge'); ?>
                <table class="form-table" role="presentation">
                    <tr>
                        <th scope="row">
                            <label for="openseo_bridge_secret">Shared secret</label>
                        </th>
                        <td>
                            <input
                                id="openseo_bridge_secret"
                                name="openseo_bridge_secret"
                                type="password"
                                class="regular-text"
                                value="<?php echo esc_attr((string) get_option('openseo_bridge_secret', '')); ?>"
                                autocomplete="new-password"
                            />
                            <p class="description">Send this value in the x-openseo-secret header.</p>
                        </td>
                    </tr>
                </table>
                <?php submit_button(); ?>
            </form>
        </div>
        <?php
    }
}
