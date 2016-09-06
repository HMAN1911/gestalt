#!/bin/bash

# Builds docs and deploys them to GitHub pages.
# usage: ./scripts/ghpages

# Aborts script on command failure
set -e

# Prints out commands about to be executed
set -x

git checkout -b tmp-deploy
npm run build_docs
git add docs
git commit -m "Deployed to Github Pages"
git push origin :gh-pages
git subtree push --prefix docs origin gh-pages
git checkout master
git reset --hard HEAD
git branch -D tmp-deploy