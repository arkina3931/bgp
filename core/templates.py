from typing import Any

from fastapi import Request
from fastapi.templating import Jinja2Templates
from starlette.templating import _TemplateResponse


def render_template(
    templates: Jinja2Templates,
    request: Request,
    name: str,
    context: dict[str, Any] | None = None,
) -> _TemplateResponse:
    merged = {"request": request}
    if context:
        merged.update(context)
    return templates.TemplateResponse(request=request, name=name, context=merged)
