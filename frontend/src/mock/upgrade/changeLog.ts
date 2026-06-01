interface UpgradeLog {
  version: string
  title: string
  date: string
  detail?: string[]
  requireReLogin?: boolean
  remark?: string
}

export const upgradeLogList = ref<UpgradeLog[]>([
  {
    version: 'v1.0.0',
    title: 'AI 知识库平台首次发布',
    date: '2026-06-01',
    detail: [
      '知识库：支持创建和加入知识库，所有者可管理成员、审批加入请求、发出邀请链接，成员可查看内容并参与检索',
      '文档中心：支持 PDF、DOCX、MD、TXT、XLSX 格式上传，可断点续传；文档状态实时追踪（已上传、处理中、已就绪、失败），支持预览、重试和删除',
      '智能检索：知识库范围内问答，混合检索（PgVector 语义 + Elasticsearch BM25 关键词）经 RRF 融合后生成回答，引用来源内嵌展示、证据评分可见',
      '智能助手：多轮 ReAct Agent 对话，知识库检索作为可调用工具；支持流式输出、Markdown 渲染、中途停止生成；会话可重命名和删除',
      '系统管理：管理员专享管理概览与用户管理页面，系统角色（管理员/普通用户）与知识库角色（所有者/成员）严格隔离',
      '认证安全：JWT 双令牌（访问+刷新）机制，登录页滑块验证码、记住密码、忘记密码入口；BCrypt 密码加密，Cookie 刷新令牌',
      '数据隔离：所有检索、问答、向量查询均按 groupId 过滤，杜绝跨知识库数据泄露',
      'ETL 管线：PDF/DOCX/MD/TXT 解析（策略模式），分块写入 PgVector + Elasticsearch IK 索引，异步事件驱动，处理中卡住自动恢复',
    ],
  },
])