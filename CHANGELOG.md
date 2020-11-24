- Version 0.8.5+1748: update yarn locks (#552) PR url: git@github.com:nutanix/papiea.git/pull/552
- Version 0.8.4+1735: Changed error message for bad request error in validator (#549) PR url: git@github.com:nutanix/papiea.git/pull/549
- Version 0.8.3+1732: Fix swagger errors in papiea-engine (#548) PR url: git@github.com:nutanix/papiea.git/pull/548
- Version 0.8.2+1727: Fix status not found deletion bug (#547) PR url: git@github.com:nutanix/papiea.git/pull/547
- Version 0.8.1+1711: Randomness in intentful handler (#535) PR url: git@github.com:nutanix/papiea.git/pull/535
  * Breaking changes:
    1. Intentful Status:
        * Removed `Pending` status
        * Removed `Failed` status
    2. Intent Watcher:
        * Removed `times_failed` field
        * Removed `last_handler_error` field
    3. DiffContent (previously referred to as `diff.diff_fields`)
        * Introduced `DiffContent` interface
        * Added `path` field
- Version 0.7.23+1705: Added stacktrace and errors field for validation error type (#543) PR url: git@github.com:nutanix/papiea.git/pull/543
- Version 0.7.22+1697: Fixed nested value of type any in update_status issue and added test for the same. (#542) PR url: git@github.com:nutanix/papiea.git/pull/542
- Version 0.7.21+1682: Optional field nullable issue fix (#539) PR url: git@github.com:nutanix/papiea.git/pull/539
- Version 0.7.20+1657: Bump pyxdg from 0.25 to 0.26 in /papiea-sdk/python/e2e_tests (#524) PR url: git@github.com:nutanix/papiea.git/pull/524
- Version 0.7.19+1653: fix partial array update error (#533) PR url: git@github.com:nutanix/papiea.git/pull/533
- Version 0.7.18+1649: Merge branch 'nitesh/reduce_verbose_logging' of https://github.com/nutanix/papiea into nitesh/reduce_verbose_logging
- Version 0.7.17+1644: Bump cryptography from 2.1.4 to 2.3 in /papiea-sdk/python/e2e_tests (#525) PR url: git@github.com:nutanix/papiea.git/pull/525
- Version 0.7.16+1641: Merge remote-tracking branch 'origin/master'
- Version 0.7.13+1631: fixed validator error connected to optional fields (#529) PR url: git@github.com:nutanix/papiea.git/pull/529
- Version 0.7.12+1613: Add IntentWatcher API (#516) PR url: git@github.com:nutanix/papiea.git/pull/516
- Version 0.7.11+1608: fixed the problem & introduced tests (#522) PR url: git@github.com:nutanix/papiea.git/pull/522
- Version 0.7.10+1592: add new options to customize timeouts (#520)
- Version 0.0.203+1586: build dir to exclude while compiling
- Version 0.0.202+1583: build packages on CI machine
- Version 0.0.201+1580: Merge remote-tracking branch 'origin/igor-fix-incomplete-packages' into igor-fix-incomplete-packages
- Version 0.0.200+1577: adding build to publish artifacts
- Version 0.7.9+1569: Added papiea customization via file config (#510)
- Version 0.7.8+1557: fixed multiple validation problems (#512) PR url: git@github.com:nutanix/papiea.git/pull/512
- Version 0.7.7+1552: Bump bl from 2.2.0 to 2.2.1 in /papiea-engine (#506)
- Version 0.7.6+1545: Exponential backoff implementation (#507)
- Version 0.7.5+1541: Fixed provider not found return error code from 500 to 404 (#509)
- Version 0.7.4+1525: Race condition in diff engine (#481) PR url: git@github.com:nutanix/papiea.git/pull/481
- Version 0.7.3+1505: Bump bl from 2.2.0 to 2.2.1 in /papiea-engine (#496) PR url: git@github.com:nutanix/papiea.git/pull/496
- Version 0.7.2+1499: remove old versions from changelog
- Version 0.7.1+1496: changed release version
- Version : introduce appending changes to CHANGELOG.md when PR is merged to master (#498), manually bump versions (#499)
# Changelog

All notable changes to this project will be documented in this file.
