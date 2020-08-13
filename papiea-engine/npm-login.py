#!/usr/bin/env python
import os
import sys

npm_token = os.environ.get("NPM_CONFIG_TOKEN")

if not npm_token:
    print("No NPM_TOKEN found, exiting")
    sys.exit(1)

# Npm will substitute the token itself
# Note: env variable name should be prefixed with NPM_CONFIG_
with open("~/.npmrc", "w") as file:
    file.write('//nutanix.jfrog.io/nutanix/api/npm/npm-virtual/:_authToken=$TOKEN')
