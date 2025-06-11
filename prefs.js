'use strict';

import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import Gtk from 'gi://Gtk';

import {ExtensionPreferences} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

export default class MouseBatteryPreferences extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        // Create a preferences page
        const page = new Adw.PreferencesPage();
        
        // Create a preferences group
        const group = new Adw.PreferencesGroup({
            title: 'General Settings',
            description: 'Configure the mouse battery indicator'
        });
        page.add(group);

        // Add update interval setting
        const updateIntervalRow = new Adw.ActionRow({
            title: 'Update Interval',
            subtitle: 'How often to check the battery status (in seconds)'
        });
        group.add(updateIntervalRow);

        const updateIntervalSpinButton = new Gtk.SpinButton({
            adjustment: new Gtk.Adjustment({
                lower: 1,
                upper: 3600,
                step_increment: 1,
                page_increment: 10,
                value: 10
            }),
            valign: Gtk.Align.CENTER
        });
        updateIntervalRow.add_suffix(updateIntervalSpinButton);
        updateIntervalRow.activatable_widget = updateIntervalSpinButton;

        // Add the page to the window
        window.add(page);
    }
}
