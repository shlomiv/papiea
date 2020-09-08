#!/usr/bin/env bash
python3 -m pip install --user --upgrade setuptools wheel

VERSION="$1" python3 setup.py sdist bdist_wheel

python3 -m pip install --user --upgrade twine

export TWINE_USERNAME="$ARTIFACTORY_USER"
export TWINE_PASSWORD="$ARTIFACTORY_PASSWORD"

python3 -m twine upload --repository-url https://nutanix.jfrog.io/nutanix/api/pypi/pypi-remote dist/*
