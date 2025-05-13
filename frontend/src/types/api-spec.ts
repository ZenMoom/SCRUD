import type { ApiProcessStateEnumDto } from "@generated/model"
import type { ApiSpecVersionResponse as BaseApiSpecVersionResponse } from "@generated/model"

// ApiSpecVersionResponse 인터페이스 확장
export interface ExtendedApiSpecVersionResponse extends BaseApiSpecVersionResponse {
  apiSpecStatus?: ApiProcessStateEnumDto
}
