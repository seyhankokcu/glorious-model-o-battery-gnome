.PHONY: all zip install uninstall clean

# Glorious Model O Battery Extension for GNOME Shell
EXTENSION_UUID := mouse-battery@seyhankokcu

all: zip

zip: clean
	zip -r $(EXTENSION_UUID).zip \
		stylesheet.css \
		extension.js \
		metadata.json \
		LICENSE \
		README.md

install: zip
	mkdir -p ~/.local/share/gnome-shell/extensions/$(EXTENSION_UUID)
	unzip -o $(EXTENSION_UUID).zip -d ~/.local/share/gnome-shell/extensions/$(EXTENSION_UUID)/

uninstall:
	-rm -rf ~/.local/share/gnome-shell/extensions/$(EXTENSION_UUID)

clean:
	-rm -f $(EXTENSION_UUID).zip
	-rm -rf ~/.local/share/gnome-shell/extensions/$(EXTENSION_UUID)
