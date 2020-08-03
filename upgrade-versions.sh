# This is a script that updates typescript SDK, prints out
# Typescript SDK version, Python commit hash
# You use these to update README.md section 'Papiea versions'

NPM_REGISTRY=$(npm config list | grep '^registry')
YARN_REGISTRY=$(yarn config list | grep -m 1 'registry' | sed -e 's/^[ \t]*//')

if [ "$NPM_REGISTRY" != 'registry = "https://nutanix.jfrog.io/nutanix/api/npm/npm-virtual/"' ]
then
  echo "Your npm registry is not set to nutanix jfrog!"
  exit 1
fi

if [ "$YARN_REGISTRY" != "registry: 'https://nutanix.jfrog.io/nutanix/api/npm/npm-virtual/'," ]
then
  echo "Your yarn registry is not set to nutanix jfrog!"
  exit 1
fi

yarn run patch-all > temp_version.txt
node publish-papiea.js

typescipt_version=$(grep -m 1 'New version' temp_version.txt | sed 's/[a-zA-Z :]*//')
python_version=$(git rev-parse HEAD)

sed -i '' "/Client\/SDK (typescript)/c\\
| Client/SDK (typescript)  | $typescipt_version |
" README.md

sed -i '' "/Client\/SDK (python)/c\\
| Client/SDK (python)  | $python_version |
" README.md

echo "Python commit hash: $python_version ; Typescript version: $typescipt_version. Committing"

git ls-files . | grep 'package\.json' | xargs git add

git add README.md

git commit -m '[skip-ci] Upgrade versions'

git push

echo 'Versions updated successfully!'
