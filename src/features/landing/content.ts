/**
 * 소개 화면의 로그 형식·설정 예시·자주 묻는 질문.
 * 내용은 backend/docs/DESIGN.md(입력 로그 포맷, 분석 알고리즘)와 실제 파서 규칙을 따른다.
 */

export const LOG_FIELDS = [
  { name: 'ts', required: true, use: '요청 시각. 시간대가 있는 ISO-8601 (Z 또는 +09:00)' },
  { name: 'method', required: true, use: 'HTTP 메서드' },
  { name: 'path', required: true, use: '쿼리를 포함한 경로. /로 시작' },
  { name: 'status', required: true, use: '응답 코드. GET 2xx만 캐시 대상으로 봐요' },
  { name: 'latencyMs', required: false, use: '응답 시간(ms, 정수). 아낄 수 있는 백엔드 시간을 계산해요' },
  { name: 'size', required: false, use: '응답 크기(바이트). 캐시 메모리를 추정해요' },
  { name: 'respHash', required: false, use: '응답 바디 해시(64자 이하). 오래된 응답을 정확히 세요' },
] as const

export const NGINX_LOG = `# nginx.conf의 http 블록
log_format ttl escape=json
  '{"ts":"$time_iso8601","method":"$request_method",'
  '"path":"$request_uri","status":$status,"size":$body_bytes_sent}';

access_log /var/log/nginx/ttl-access.jsonl ttl;`

export const SPRING_LOG = `@Component
public class AccessLogFilter extends OncePerRequestFilter {
    private static final Logger log = LoggerFactory.getLogger("ttl.access");
    private final ObjectMapper mapper = new ObjectMapper();

    @Override
    protected void doFilterInternal(HttpServletRequest req, HttpServletResponse res,
                                    FilterChain chain) throws ServletException, IOException {
        long start = System.currentTimeMillis();
        try {
            chain.doFilter(req, res);
        } finally {
            String query = req.getQueryString();
            Map<String, Object> line = new LinkedHashMap<>();
            line.put("ts", Instant.ofEpochMilli(start).toString());
            line.put("method", req.getMethod());
            line.put("path", query == null ? req.getRequestURI() : req.getRequestURI() + "?" + query);
            line.put("status", res.getStatus());
            line.put("latencyMs", System.currentTimeMillis() - start);
            log.info(mapper.writeValueAsString(line));
        }
    }
}`

/** 예시 결과(GET /products/:id, 추천 60초)를 각 계층의 설정으로 옮긴 모습 */
export function configSnippets(seconds: number) {
  return {
    redis: `SET products:123 "<응답 JSON>" EX ${seconds}`,
    spring: `@Bean
RedisCacheManagerBuilderCustomizer productCacheTtl() {
    return builder -> builder.withCacheConfiguration("products",
            RedisCacheConfiguration.defaultCacheConfig().entryTtl(Duration.ofSeconds(${seconds})));
}

@Cacheable(cacheNames = "products", key = "#id")
public ProductResponse getProduct(long id) { ... }`,
    http: `Cache-Control: public, max-age=${seconds}`,
  }
}

export const FAQ = [
  {
    q: '올린 로그는 어디에 보관되나요?',
    a: '서버 데이터베이스에 줄 단위로 저장해 분석에 써요. 내 계정에서만 볼 수 있고, 프로젝트를 지우면 그 프로젝트의 로그도 함께 지워져요.',
  },
  {
    q: '로그에 개인정보가 들어 있으면요?',
    a: '위 표의 일곱 필드만 읽고, 다른 필드는 저장하지 않아요. 경로와 쿼리는 그대로 저장하니 쿼리에 이메일이나 토큰 같은 값이 있으면 올리기 전에 지우거나 바꿔 주세요.',
  },
  {
    q: '로그가 얼마나 있어야 하나요?',
    a: '엔드포인트마다 요청이 너무 적으면 "데이터 부족"으로 판정하고 추천하지 않아요. 로그 기간의 절반보다 긴 TTL도 후보에서 빼요. 1시간 TTL까지 비교하려면 2시간이 넘는 로그가 필요해요.',
  },
  {
    q: 'respHash가 없으면 어떻게 되나요?',
    a: '같은 리소스에 쓰기 요청(POST·PUT·PATCH·DELETE)이 온 때를 데이터가 바뀐 때로 봐요. 배치 작업처럼 API를 거치지 않고 바뀌는 데이터는 놓칠 수 있어서, 오래된 응답 비율이 실제보다 낮게 나올 수 있어요.',
  },
  {
    q: '쓰기 API는 어떻게 다루나요?',
    a: '캐시 대상은 GET 2xx 응답이에요. 쓰기 요청은 같은 리소스(쿼리를 뺀 경로)의 캐시를 비우는 데 써요. 예를 들어 PUT /products/123은 GET /products/123?lang=ko 캐시를 비워요. 쓰기 비중이 높은 엔드포인트는 "캐시 비추천"으로 판정해요.',
  },
] as const

export const GITHUB_ORG = 'https://github.com/TTL-ADVISOR'
