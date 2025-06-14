/*
 * Glorious Model O Wireless Battery Indicator Extension for GNOME Shell
 * 
 * This extension displays the battery level of a Glorious Model O Wireless gaming mouse
 * in the GNOME Shell top bar. It shows the battery percentage and indicates charging
 * status through icon colors.
 *
 * Features:
 * - Battery percentage display
 * - Charging status indication (yellow icon)
 * - Full charge indication (green icon)
 * - Auto-hide when mouse is asleep or disconnected
 * - Detailed status in popup menu
 *
 * Author: Seyhan Kokcu
 * License: GPL-2.0-or-later
 */

import GLib from 'gi://GLib';
import St from 'gi://St';
import GObject from 'gi://GObject';
import Clutter from 'gi://Clutter';
import Gio from 'gi://Gio';

import * as Main from 'resource:///org/gnome/shell/ui/main.js';
import {Extension} from 'resource:///org/gnome/shell/extensions/extension.js';
import * as PanelMenu from 'resource:///org/gnome/shell/ui/panelMenu.js';
import * as PopupMenu from 'resource:///org/gnome/shell/ui/popupMenu.js';

// Constants
const MOUSE_MODEL = 'Glorious Model O Wireless';
const UPDATE_INTERVAL = 10; // Update interval in seconds
const ICON_COLORS = {
    CHARGING: 'charging-icon',
    FULL: 'fully-charged-icon'
};

/**
 * MouseBatteryIndicator Class
 * Manages the top bar indicator and popup menu for displaying mouse battery status
 */
const MouseBatteryIndicator = GObject.registerClass(
class MouseBatteryIndicator extends PanelMenu.Button {
    _init() {
        super._init(0.0, MOUSE_MODEL);

        // Create the icon
        this._icon = new St.Icon({
            icon_name: 'input-mouse-symbolic',
            style_class: 'system-status-icon'
        });

        // Create the label
        this._label = new St.Label({
            text: '--%',
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER,
            style_class: 'mouse-battery-label'
        });

        // Create layout and add elements
        let box = new St.BoxLayout({
            style_class: 'mouse-battery-indicator'
        });
        box.add_child(this._icon);
        box.add_child(this._label);
        this.add_child(box);

        this._createMenu();
        
        // Initial battery status update
        this._updateBattery().catch(e => {
            console.error('Error in initial battery status update:', e);
            this.hide();
        });
        
        // Get settings
        this._settings = this.extension.getSettings();
        
        // Set up periodic updates based on settings
        this._settings.connect('changed::update-interval', () => {
            if (this._timeout) {
                GLib.source_remove(this._timeout);
            }
            this._addTimeout();
        });
        
        this._addTimeout();
    }

    _addTimeout() {
        const interval = this._settings.get_int('update-interval');
        this._timeout = GLib.timeout_add_seconds(
            GLib.PRIORITY_DEFAULT,
            interval,
            () => {
                this._updateBattery().catch(e => {
                    console.error('Error updating battery status:', e);
                    this.hide();
                });
                return GLib.SOURCE_CONTINUE;
            }
        );
    }

    _createMenu() {
        // Create header with model info
        let headerBox = new St.BoxLayout({
            style_class: 'mouse-battery-header'
        });
        
        let modelLabel = new St.Label({
            text: MOUSE_MODEL,
            style_class: 'mouse-battery-model'
        });
        headerBox.add_child(modelLabel);
        
        let headerItem = new PopupMenu.PopupBaseMenuItem({
            reactive: false,
            style_class: 'mouse-battery-header-item'
        });
        headerItem.add_child(headerBox);
        this.menu.addMenuItem(headerItem);

        // Add separator
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());

        // Add battery status item
        this._batteryItem = new PopupMenu.PopupMenuItem('', {
            reactive: false,
            style_class: 'mouse-battery-info-item'
        });
        this.menu.addMenuItem(this._batteryItem);
    }

    async _updateBattery() {
        try {
            const proc = new Gio.Subprocess({
                argv: ['mow', 'report', 'battery'],
                flags: Gio.SubprocessFlags.STDOUT_PIPE | Gio.SubprocessFlags.STDERR_PIPE
            });
            
            proc.init(null);
            
            const result = await new Promise((resolve, reject) => {
                proc.communicate_utf8_async(null, null, (proc, result) => {
                    try {
                        const [, stdout, stderr] = proc.communicate_utf8_finish(result);
                        resolve({ stdout, stderr });
                    } catch (e) {
                        reject(e);
                    }
                });
            });

            const status = result.stdout.trim();
            
            if (!status || proc.get_status() !== 0) {
                this.hide();
                return;
            }
            
            // Handle sleep or invalid state
            if (status === '(asleep)' || !status.includes('%')) {
                this.hide();
                return;
            }

            // Extract percentage and update UI
            const match = status.match(/(\d+)%/);
            if (!match) {
                this.hide();
                return;
            }

            const percentage = match[1] + '%';
            
            // Update UI elements
            this.show();
            this._label.text = percentage;
            this._batteryItem.label.text = `Battery Level: ${status}`;

            // Update icon state with optimized conditions
            const isCharging = status.includes('charging');
            const isFullyCharged = status.includes('fully charged');
            
            this._icon.style_class = 'system-status-icon' + 
                (isCharging ? ' ' + ICON_COLORS.CHARGING : 
                 isFullyCharged ? ' ' + ICON_COLORS.FULL : '');
        } catch (e) {
            logError(e);
            this.hide();
        }
    }

    destroy() {
        if (this._timeout) {
            GLib.source_remove(this._timeout);
            this._timeout = null;
        }
        super.destroy();
    }
});

/**
 * Extension class
 * Handles extension lifecycle (enable/disable)
 */
export default class MouseBatteryExtension extends Extension {
    enable() {
        this._indicator = new MouseBatteryIndicator();
        Main.panel.addToStatusArea(this.uuid, this._indicator);
    }

    disable() {
        this._indicator?.destroy();
        this._indicator = null;
    }
}
