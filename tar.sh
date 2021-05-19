#!/bin/bash

rm -rf easy-git.zip
zip -q -r easy-git.zip . -x /.git/* /src/common/mix.source.js /src/common/oauth.source.js /run.sh /tar.sh /.gitignore /.gitattributes /.editorconfig /docs/git
