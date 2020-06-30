import json
from typing import Any

from papiea.core import AttributeDict


def json_loads_attrs(s: str) -> Any:
    def object_hook(obj):
        return AttributeDict(obj)

    return json.loads(s, object_hook=object_hook)