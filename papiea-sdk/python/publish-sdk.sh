#!/usr/bin/env bash

# This scripts builds and pushes python distributable
# to nutanix remote pypi repo
python3 -m pip install --user --upgrade setuptools wheel

# Version is passed here as a hack
# since there isn't an easy way to
# add params to setup.py
VERSION="$1" python3 setup.py sdist bdist_wheel

python3 -m pip install --user --upgrade twine

export TWINE_USERNAME="$ARTIFACTORY_USER"
export TWINE_PASSWORD="$ARTIFACTORY_PASSWORD"

python3 -m twine upload --repository-url https://nutanix.jfrog.io/nutanix/api/pypi/pypi-remote dist/*
