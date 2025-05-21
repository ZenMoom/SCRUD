// services/rulesService.ts
import { formatToKST } from '@/util/dayjs';
import { OperationFieldRule, RulesResponse } from '../types/rules';

// JSON 파일 경로
const RULES_FILE_PATH = '/data/rules.json';

/**
 * API 규칙 데이터를 불러오는 함수
 * @returns {Promise<RulesResponse>} 규칙 데이터
 */
export const fetchRules = async (): Promise<RulesResponse> => {
  try {
    const response = await fetch(RULES_FILE_PATH);

    if (!response.ok) {
      throw new Error(`Failed to fetch rules: ${response.status} ${response.statusText}`);
    }

    const data: RulesResponse = await response.json();
    return data;
  } catch (error) {
    console.error(formatToKST(new Date().toISOString()), 'Error fetching rules:', error);
    // 에러 발생 시 기본 빈 객체 반환
    return {
      spec_version: {
        spec_version_id: 0,
        open_api_version: '3.0.1',
        description: '',
      },
      operation_field_rules: [],
      description: '',
      service_spec_version_id: 0,
      scrud_version: '',
      status: 'error',
    };
  }
};

/**
 * HTTP 메서드에 따라 적용 가능한 규칙 필터링
 * @param {OperationFieldRule[]} rules 전체 규칙 목록
 * @param {string} method HTTP 메서드 (GET, POST, PUT, PATCH, DELETE)
 * @returns {OperationFieldRule[]} 필터링된 규칙 목록
 */
export const getApplicableRulesByMethod = (rules: OperationFieldRule[], method: string): OperationFieldRule[] => {
  // 1. 일반적인 모든 메서드에 공통으로 적용되는 규칙을 먼저 필터링
  const commonRules = rules.filter(
    (rule) => rule.field_name === 'parameters' || rule.field_name === 'responses' || rule.field_name === 'requestBody'
  );

  // 2. 메서드별 특정 규칙 필터링
  const methodSpecificRules = rules.filter((rule) => {
    switch (method) {
      case 'GET':
        return (
          rule.field_name === 'GET 메서드 규칙' ||
          // GET 메서드는 parameter_rules만 관련 있음
          (rule.parameter_rules && rule.parameter_rules.length > 0 && !rule.request_rules)
        );

      case 'POST':
        return (
          rule.field_name === 'POST 메서드 규칙' ||
          // POST 메서드는 request_rules가 필수
          (rule.request_rules && rule.request_rules.length > 0)
        );

      case 'PUT':
        return (
          rule.field_name === 'PUT 메서드 규칙' ||
          // PUT은 request_rules와 path parameter가 필요
          (rule.request_rules && rule.parameter_rules?.some((param) => param.in_type === 'path'))
        );

      case 'PATCH':
        return (
          rule.field_name === 'PATCH 메서드 규칙' ||
          // PATCH도 request_rules와 path parameter가 필요
          (rule.request_rules && rule.parameter_rules?.some((param) => param.in_type === 'path'))
        );

      case 'DELETE':
        return (
          rule.field_name === 'DELETE 메서드 규칙' ||
          // DELETE는 path parameter가 필요하고 일반적으로 request body는 없음
          (rule.parameter_rules?.some((param) => param.in_type === 'path') && !rule.request_rules)
        );

      default:
        return false;
    }
  });

  // 중복 제거를 위해 Set 사용 (규칙의 operation_field_rule_id로 구분)
  const combinedRuleIds = new Set<number>();
  const combinedRules: OperationFieldRule[] = [];

  // 메서드별 특정 규칙을 우선적으로 추가
  methodSpecificRules.forEach((rule) => {
    if (!combinedRuleIds.has(rule.operation_field_rule_id)) {
      combinedRuleIds.add(rule.operation_field_rule_id);
      combinedRules.push(rule);
    }
  });

  // 공통 규칙 추가 (중복 없는 경우만)
  commonRules.forEach((rule) => {
    if (!combinedRuleIds.has(rule.operation_field_rule_id)) {
      combinedRuleIds.add(rule.operation_field_rule_id);
      combinedRules.push(rule);
    }
  });

  return combinedRules;
};
