import logging
from typing import Optional

from app.api.dto.diagram_dto import DiagramResponse
from app.infrastructure.mongodb.repository.diagram_repository import DiagramRepository


class DiagramService:
    def __init__(
            self,
            repository: Optional[DiagramRepository] = None,
            logger: Optional[logging.Logger] = None,
    ):
        self.repository = repository
        self.logger = logger or logging.getLogger(__name__)

    async def get_diagram(self, project_id, api_id, version_id) -> DiagramResponse:
        pass

    async def create_diagram(self, project_id, api_id) -> DiagramResponse:
        pass

    async def update_component_position(self, project_id, api_id, component_id, position_data) -> DiagramResponse:
        pass
