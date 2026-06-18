/* ===== StarMap 通用类型定义 ===== */

/* 网站条目 */
export interface WebItem {
  name: string
  desc: string
  url: string
  icon: string
  rate: number
  tag?: string
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
  showSearch: boolean
  defaultSearchEngine: string
  showSideImage: boolean
  tags: string[]
  colorPrimary: string
  hashMode: boolean
  branch: string
  gitRepoUrl: string
  imageRepoUrl: string
  version: string
}

/* 标签 */
export interface TagItem {
  id: number
  name: string
  color: string
}

/* 应用模块 */
export type AppModule = 'nav' | 'software' | 'tools' | 'blog'
