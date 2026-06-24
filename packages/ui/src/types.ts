/* ===== StarMap 通用类型定义 ===== */

/* 关联文章 */
export interface RelatedArticle {
  title: string
  url: string
}

/* 网站条目 */
export interface WebItem {
  name: string
  desc: string
  url: string
  icon: string
  rate: number
  tag?: string
  relatedArticles?: RelatedArticle[]
}

/* 子分类（第2级） */
export interface SubCategory {
  title: string
  id: number
  nav: WebItem[]
}

/* 顶级分类（第1级） */
export interface Category {
  title: string
  id: number
  icon: string
  children: SubCategory[]
}

export type NavData = Category[]

/* 搜索引擎 */
export interface SearchEngine {
  name: string
  icon: string
  url: string
  isDefault?: boolean
}

/* 系统设置 */
export interface Settings {
  title: string
  subtitle: string
  description: string
  keywords: string
  logo: string
  favicon: string
  theme: 'light' | 'dark' | 'auto'
  homeTitle: string
  icp: string
  footerHtml: string
  showGithub: boolean
  githubUrl: string
  showRuntime: boolean
  runtimeDate: string
  showLogin: boolean
  showRating: boolean
  defaultSearchEngine: string
  tags: string[]
  colorPrimary: string
  hashMode: boolean
  branch: string
  gitRepoUrl: string
  imageRepoUrl: string
  version: string
  iconCdnMode?: 'jsdelivr' | 'statically' | 'githack' | 'custom' | 'none'
  iconCdnCustomBase?: string
}

/* 标签 */
export interface TagItem {
  id: number
  name: string
  color: string
  desc?: string
  noOpen?: boolean
  sort?: number
}

/* 应用模块 */
export type AppModule = 'nav' | 'software' | 'tools' | 'blog'
