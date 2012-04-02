docs: docs/index.html

docs/index.html:
    dox \
		--private \
		--title "pathlength" \
		--desc "File path length checker for Node.js" \
		lib/*.js > $@

docclean:
	rm -f docs/index.html

.PHONY: docs docclean