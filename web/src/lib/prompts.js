// 红果万事屋 · 一键提示词数据
// 依据：红果万事屋系统提示词的 17 个工具 / 6 大能力簇
// 约束：每条 ≤20 字（系统提示词对推荐问题的长度要求）
// 维护：Agent 能力变化时只改这个文件，组件不用动
// desc 字段用于主页「能做什么」能力格
export const PROMPT_GROUPS = [
  {
    key: 'mis-query',
    label: '教务查询',
    mark: 'red', // 分类小方块颜色：red / ink / gold
    note: '需登录',
    desc: '成绩、课表、考试、空教室，教务系统一站式查',
    prompts: ['查这学期成绩', '明天有什么课', '查一下考试安排', '九教现在有空教室吗'],
  },
  {
    key: 'academic-credit',
    label: '学业学分',
    mark: 'red',
    note: '需登录',
    desc: '学分进度、素质拓展、选课建议、成绩单导出',
    prompts: ['查我还差多少学分', '素质拓展还差多少', '下学期选课建议', '导出我的成绩单'],
  },
  {
    key: 'campus-map',
    label: '校园地图',
    mark: 'ink',
    desc: '三个校区的地图与地点指引',
    prompts: ['给我三个校区的地图', '学一食堂在哪', '快递站在哪'],
  },
  {
    key: 'campus-service',
    label: '校园服务',
    mark: 'ink',
    note: '需登录',
    desc: '助管助教岗位、宣讲会、亲友入校预约',
    prompts: ['查助管助教岗位', '最近有什么宣讲会', '亲友入校怎么预约'],
  },
  {
    key: 'info-search',
    label: '信息搜索',
    mark: 'gold',
    desc: '规章制度、真题资料、官网导航、论坛经验',
    prompts: ['研究生最长学习年限', '信号与系统期末真题', '教务处电话是多少'],
  },
  {
    key: 'scholarship',
    label: '奖助竞赛',
    mark: 'gold',
    desc: '研究生/本科奖学金政策、可参加的竞赛',
    prompts: ['研究生奖学金怎么评', '本科奖学金有哪些', '我可以参加哪些竞赛'],
  },
  {
    key: 'help-board',
    label: '互助墙',
    mark: 'gold',
    desc: '同学互助、二手闲置、拼单、失物招领',
    prompts: ['看看互助墙有什么帖子', '发个闲置转让帖', '发个求助帖'],
  },
];
