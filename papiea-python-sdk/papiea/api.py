import json
import logging
from types import TracebackType
from typing import Any, Optional, Type

from aiohttp import ClientSession, ClientTimeout
from multidict import CIMultiDict

from papiea.python_sdk_exceptions import check_response
from papiea.utils import json_loads_attrs


class ApiInstance(object):
    def __init__(self, base_url: str, timeout: int = 5000, headers: dict = {}, *, logger: logging.Logger):
        self.base_url = base_url
        self.headers = headers
        self.timeout = timeout
        # Shlomi: This does not work! 
        self.session = ClientSession(timeout=ClientTimeout(total=timeout))
        self.logger = logger

    async def __aenter__(self) -> "ApiInstance":
        return self

    async def __aexit__(
        self,
        exc_type: Optional[Type[BaseException]],
        exc_val: Optional[BaseException],
        exc_tb: Optional[TracebackType],
    ) -> None:
        await self.close()

    async def post(self, prefix: str, data: dict, headers: dict = {}) -> Any:
        new_headers = CIMultiDict()
        new_headers.update(self.headers)
        new_headers.update(headers)
        data_binary = json.dumps(data).encode("utf-8")
        async with self.session.post(
            self.base_url + "/" + prefix, data=data_binary, headers=new_headers
        ) as resp:
            await check_response(resp, self.logger)
            res = await resp.text()
        if res == "":
            return None
        return json_loads_attrs(res)

    async def put(self, prefix: str, data: dict, headers: dict = {}) -> Any:
        new_headers = CIMultiDict()
        new_headers.update(self.headers)
        new_headers.update(headers)
        data_binary = json.dumps(data).encode("utf-8")
        async with self.session.put(
            self.base_url + "/" + prefix, data=data_binary, headers=new_headers
        ) as resp:
            await check_response(resp, self.logger)
            res = await resp.text()
        if res == "":
            return None
        return json_loads_attrs(res)

    async def patch(self, prefix: str, data: dict, headers: dict = {}) -> Any:
        new_headers = CIMultiDict()
        new_headers.update(self.headers)
        new_headers.update(headers)
        data_binary = json.dumps(data).encode("utf-8")
        this = self
        async def patcher():
            async with this.session.patch(
                this.base_url + "/" + prefix, data=data_binary, headers=new_headers
            ) as resp:
                await check_response(resp, this.logger)
                res = await resp.text()
            if res == "":
                return None
            return json_loads_attrs(res)

        try:
            await patcher()
        except:
            self.logger.debug("RENEWING SESSION")
            await self.session.close()
            self.session = ClientSession(timeout=ClientTimeout(total=self.timeout))
            await patcher()

    async def get(self, prefix: str, headers: dict = {}) -> Any:
        new_headers = CIMultiDict()
        new_headers.update(self.headers)
        new_headers.update(headers)
        async with self.session.get(
            self.base_url + "/" + prefix, headers=new_headers
        ) as resp:
            await check_response(resp, self.logger)
            res = await resp.text()
        if res == "":
            return None
        return json_loads_attrs(res)

    async def delete(self, prefix: str, headers: dict = {}) -> Any:
        new_headers = CIMultiDict()
        new_headers.update(self.headers)
        new_headers.update(headers)
        async with self.session.delete(
            self.base_url + "/" + prefix, headers=new_headers
        ) as resp:
            await check_response(resp, self.logger)
            res = await resp.text()
        if res == "":
            return None
        return json_loads_attrs(res)

    async def close(self):
        await self.session.close()
