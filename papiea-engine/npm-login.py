#!/usr/bin/env python
import os
import sys

npm_token = os.environ.get("NPM_TOKEN")

if not npm_token:
    print("No NPM_TOKEN found, exiting")
    sys.exit(1)

with open("~/.npmrc", "w") as file:
    file.write('registry=https://nutanix.jfrog.io/nutanix/api/npm/npm-virtual/\n_auth={}\nalways-auth=true\n'.format(npm_token))
